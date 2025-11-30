// frontend/lib/klineOverlays.ts

// Simple helper to safely register overlays only once
let overlaysRegistered = false;

export function registerCustomOverlays(klinecharts: any) {
  if (!klinecharts || overlaysRegistered) return;
  overlaysRegistered = true;

  const { registerOverlay } = klinecharts;

  // ===========================
  // 1) RECTANGLE (rectBox)
  // ===========================
  registerOverlay({
    name: 'rectBox',
    // 3 clicks: first point, second point, confirm
    totalStep: 3,
    needDefaultPointFigure: true,
    styles: {
      rect: {
        style: 'stroke',
        color: 'rgba(3, 169, 244, 0.08)',
        borderColor: '#03a9f4',
        borderSize: 1,
      },
    },
    createPointFigures: ({ coordinates }: any) => {
      if (coordinates.length < 2) return [];

      const p1 = coordinates[0];
      const p2 = coordinates[1];

      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p2.y - p1.y);

      if (width === 0 || height === 0) return [];

      return [
        {
          key: 'rectBox',
          type: 'rect',
          attrs: {
            x,
            y,
            width,
            height,
          },
          styles: {
            style: 'stroke_fill',
            color: 'rgba(3, 169, 244, 0.06)',
            borderColor: '#03a9f4',
            borderSize: 1,
          },
        },
      ];
    },
  });

  // ===========================
  // 2) FREE BRUSH (freeBrush)
  // ===========================
  registerOverlay({
    name: 'freeBrush',
    // we will keep drawing while mouse pressed; steps just need to be >= 2
    totalStep: 3,
    needDefaultPointFigure: false,
    styles: {
      line: {
        style: 'solid',
        size: 1.6,
        color: '#fbc02d',
      },
    },

    // Draw based on all points collected while dragging
    createPointFigures: ({ coordinates }: any) => {
      if (!coordinates || coordinates.length < 2) return [];

      return [
        {
          key: 'freeBrush-line',
          type: 'line',
          attrs: {
            coordinates,
          },
          styles: {
            style: 'solid',
            size: 1.6,
            color: '#fbc02d',
          },
        },
      ];
    },

    // While mouse is pressed and moving, keep adding points to the overlay
    performEventPressedMove: ({ points, performPoint }: any) => {
      if (!points || !performPoint) return;
      points.push({
        timestamp: performPoint.timestamp,
        dataIndex: performPoint.dataIndex,
        value: performPoint.value,
      });
    },
  });

  // ===========================
  // 3) ROTATED RECTANGLE (rotatedRect)
  // ===========================
  registerOverlay({
    name: 'rotatedRect',
    // 3 steps: p0 (start), p1 (width direction), p2 (height/rotation)
    totalStep: 4,
    needDefaultPointFigure: true,
    styles: {
      polygon: {
        style: 'stroke_fill',
        color: 'rgba(129, 212, 250, 0.06)',
        borderColor: '#29b6f6',
        borderSize: 1,
      },
    },

    createPointFigures: ({ coordinates }: any) => {
      if (coordinates.length < 2) {
        // Just show the base line while choosing 2nd point
        if (coordinates.length === 1) {
          return [
            {
              key: 'rotatedRect-temp-line',
              type: 'line',
              attrs: {
                coordinates,
              },
              styles: {
                style: 'dashed',
                size: 1,
                color: '#29b6f6',
              },
            },
          ];
        }
        return [];
      }

      const p0 = coordinates[0];
      const p1 = coordinates[1];

      // If only 2 points: simple rectangle based on them
      if (coordinates.length === 2) {
        const x = Math.min(p0.x, p1.x);
        const y = Math.min(p0.y, p1.y);
        const width = Math.abs(p1.x - p0.x);
        const height = Math.abs(p1.y - p0.y) || 1;

        return [
          {
            key: 'rotatedRect-basic',
            type: 'rect',
            attrs: {
              x,
              y,
              width,
              height,
            },
            styles: {
              style: 'stroke_fill',
              color: 'rgba(129, 212, 250, 0.06)',
              borderColor: '#29b6f6',
              borderSize: 1,
            },
          },
        ];
      }

      const p2 = coordinates[2];

      // Now build a rotated rect using 3rd point as height & angle
      const vx = p1.x - p0.x;
      const vy = p1.y - p0.y;
      const baseLen = Math.sqrt(vx * vx + vy * vy) || 1;

      // Perpendicular unit vector
      const nx = -vy / baseLen;
      const ny = vx / baseLen;

      const hx = p2.x - p1.x;
      const hy = p2.y - p1.y;
      const heightLen = Math.sqrt(hx * hx + hy * hy) || 1;

      const hxVec = nx * heightLen;
      const hyVec = ny * heightLen;

      const corner1 = { x: p0.x, y: p0.y };
      const corner2 = { x: p1.x, y: p1.y };
      const corner3 = { x: p1.x + hxVec, y: p1.y + hyVec };
      const corner4 = { x: p0.x + hxVec, y: p0.y + hyVec };

      return [
        {
          key: 'rotatedRect-poly',
          type: 'polygon',
          attrs: {
            coordinates: [corner1, corner2, corner3, corner4],
          },
          styles: {
            style: 'stroke_fill',
            color: 'rgba(129, 212, 250, 0.10)',
            borderColor: '#29b6f6',
            borderSize: 1,
          },
        },
      ];
    },
  });
}
