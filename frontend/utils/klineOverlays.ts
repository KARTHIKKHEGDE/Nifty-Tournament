// frontend/lib/klineOverlays.ts

// Simple helper to safely register overlays only once
let overlaysRegistered = false;

export function registerCustomOverlays(klinecharts: any) {
  if (!klinecharts || overlaysRegistered) return;
  overlaysRegistered = true;

  const { registerOverlay } = klinecharts;

  // ============================================================
  // 1) NORMAL RECTANGLE (rectBox)
  // ============================================================
  registerOverlay({
    name: 'rectBox',
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
          attrs: { x, y, width, height },
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

  // ============================================================
  // 2) FREE BRUSH
  // ============================================================
  registerOverlay({
    name: 'freeBrush',
    totalStep: 3,
    needDefaultPointFigure: false,
    styles: {
      line: {
        style: 'solid',
        size: 1.6,
        color: '#fbc02d',
      },
    },

    createPointFigures: ({ coordinates }: any) => {
      if (!coordinates || coordinates.length < 2) return [];

      return [
        {
          key: 'freeBrush-line',
          type: 'line',
          attrs: { coordinates },
          styles: {
            style: 'solid',
            size: 1.6,
            color: '#fbc02d',
          },
        },
      ];
    },

    performEventPressedMove: ({ points, performPoint }: any) => {
      if (!points || !performPoint) return;
      points.push({
        timestamp: performPoint.timestamp,
        dataIndex: performPoint.dataIndex,
        value: performPoint.value,
      });
    },
  });

  // ============================================================
  // 3) ROTATED RECTANGLE (rotatedRect)
  // ============================================================
  registerOverlay({
    name: 'rotatedRect',
    totalStep: 4, // p0, p1, p2
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
      // STEP 1 — Only p0
      if (coordinates.length === 1) {
        return [
          {
            key: 'rotatedRect-temp-line',
            type: 'line',
            attrs: { coordinates },
            styles: {
              style: 'dashed',
              size: 1,
              color: '#29b6f6',
            },
          },
        ];
      }

      // STEP 2 — p0, p1 → draw dashed base line
      if (coordinates.length === 2) {
        return [
          {
            key: 'rotatedRect-temp-line',
            type: 'line',
            attrs: { coordinates },
            styles: {
              style: 'dashed',
              size: 1,
              color: '#29b6f6',
            },
          },
        ];
      }

      // STEP 3 — p0, p1, raw p2 (mouse)
      if (coordinates.length >= 3) {
        const p0 = coordinates[0];
        const p1 = coordinates[1];
        const mouseP2 = coordinates[2]; // RAW MOUSE POSITION

        // -------- Compute projected height --------
        const vx = p1.x - p0.x;
        const vy = p1.y - p0.y;
        const baseLen = Math.sqrt(vx * vx + vy * vy) || 1;

        // Perpendicular direction
        let nx = -vy / baseLen;
        let ny = vx / baseLen;

        // Mouse vector from p1
        const mx = mouseP2.x - p1.x;
        const my = mouseP2.y - p1.y;

        // Project height onto perpendicular
        let height = mx * nx + my * ny;

        // Flip direction if needed
        if (height < 0) {
          nx = -nx;
          ny = -ny;
          height = -height;
        }

        // Perpendicular height vector
        const hx = nx * height;
        const hy = ny * height;

        // 4 rectangle corners
        const corner1 = { x: p0.x, y: p0.y };
        const corner2 = { x: p1.x, y: p1.y };
        const corner3 = { x: p1.x + hx, y: p1.y + hy }; // PROJECTED POINT
        const corner4 = { x: p0.x + hx, y: p0.y + hy };

        // 🚀 KEY FIX: Replace mouse position with REAL rectangle corner
        coordinates[2] = corner3;

        return [
          {
            key: 'rotatedRect-poly',
            type: 'polygon',
            attrs: { coordinates: [corner1, corner2, corner3, corner4] },
            styles: {
              style: 'stroke_fill',
              color: 'rgba(129, 212, 250, 0.10)',
              borderColor: '#29b6f6',
              borderSize: 1,
            },
          },
        ];
      }

      return [];
    },
  });

  // ============================================================
  // 4) MULTI-POINT TREND LINE (trendLine)
  // ============================================================
  registerOverlay({
    name: 'trendLine',
    totalStep: 100, // Allow up to 100 points (effectively unlimited for practical use)
    needDefaultPointFigure: true, // Show blue circles at each point
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: {
        style: 'solid',
        size: 2,
        color: '#2962ff',
      },
      point: {
        backgroundColor: '#2962ff',
        borderColor: '#ffffff',
        borderSize: 2,
        radius: 5,
        activeBackgroundColor: '#ff6b00',
        activeBorderColor: '#ffffff',
        activeBorderSize: 2,
        activeRadius: 6,
      },
    },

    createPointFigures: ({ coordinates, overlay, bounding }: any) => {
      if (!coordinates || coordinates.length === 0) return [];

      const figures: any[] = [];

      // Draw the main line connecting all points
      if (coordinates.length >= 2) {
        figures.push({
          key: 'trendLine-main',
          type: 'line',
          attrs: { coordinates },
          styles: {
            style: 'solid',
            size: 2,
            color: '#2962ff',
          },
        });
      }

      // Draw control points (circles) at each coordinate
      coordinates.forEach((point: any, index: number) => {
        figures.push({
          key: `trendLine-point-${index}`,
          type: 'circle',
          attrs: {
            x: point.x,
            y: point.y,
            r: 5,
          },
          styles: {
            style: 'fill_stroke',
            color: '#2962ff',
            borderColor: '#ffffff',
            borderSize: 2,
          },
          ignoreEvent: false, // Allow interaction with points
        });
      });

      return figures;
    },

    // Handle mouse move during drawing to show preview line
    performEventMoveForDrawing: ({ currentStep, points, performPoint }: any) => {
      if (!performPoint) return;

      // Update the last point to follow the mouse
      if (currentStep > 1) {
        points[points.length - 1] = {
          timestamp: performPoint.timestamp,
          dataIndex: performPoint.dataIndex,
          value: performPoint.value,
        };
      }
    },

    // Handle click to add a new point
    performEventPressedDrawing: ({ currentStep, points, performPoint, overlay }: any) => {
      if (!performPoint) return;

      const newPoint = {
        timestamp: performPoint.timestamp,
        dataIndex: performPoint.dataIndex,
        value: performPoint.value,
      };

      // Add the new point
      points.push(newPoint);

      // For preview: add another point that will follow the mouse
      if (currentStep < overlay.totalStep - 1) {
        points.push({ ...newPoint });
      }

      return true; // Continue drawing
    },

    // Optional: Handle double-click to finish drawing
    onDoubleClick: ({ overlay, chart }: any) => {
      // Remove the last preview point
      if (overlay.points && overlay.points.length > 1) {
        overlay.points.pop();
      }
      return true; // Finish drawing
    },
  });
}
