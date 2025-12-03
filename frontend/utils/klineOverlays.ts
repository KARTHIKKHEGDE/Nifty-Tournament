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

  // ============================================================
  // ============================================================
  // 5) FIBONACCI RETRACEMENT (REWRITTEN FOR GROWW-LIKE BEHAVIOR)
  // ============================================================
  registerOverlay({
    name: 'fibonacciRetracement',
    totalStep: 2, // start and end point
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: {
        style: 'dashed',
        size: 1,
        color: '#00baff',
      },
      point: {
        backgroundColor: '#00baff',
        borderColor: '#ffffff',
        borderSize: 2,
        radius: 5,
      },
      text: {
        family: 'monospace',
        size: 11,
      },
    },

    createPointFigures: ({ coordinates, bounding, overlay, precision }: any) => {
      // Need two anchor points
      if (!coordinates || coordinates.length < 2) return [];

      const p1 = coordinates[0];
      const p2 = coordinates[1];

      // Safety: ensure price values exist
      if (p1.value == null || p2.value == null) return [];

      const figures: any[] = [];

      // Fibonacci levels (ordered high -> low for ease)
      const levels = [
        { value: 0, label: '0%', color: '#787b86' },
        { value: 0.236, label: '23.6%', color: '#f23645' },
        { value: 0.382, label: '38.2%', color: '#ff9800' },
        { value: 0.5, label: '50%', color: '#fbc02d' },
        { value: 0.618, label: '61.8%', color: '#00baff' },
        { value: 0.786, label: '78.6%', color: '#9c27b0' },
        { value: 1, label: '100%', color: '#787b86' },
      ];

      // Price range and direction
      const value1 = p1.value;
      const value2 = p2.value;
      const range = value2 - value1;
      if (range === 0) return []; // can't compute

      const isUptrend = value2 > value1;

      // Determine drawing leftX/rightX using bounding (chart drawing area) if available.
      // bounding typically contains left/top/width/height for overlay drawing area.
      const chartLeft = (bounding && typeof bounding.left === 'number') ? bounding.left : Math.min(p1.x, p2.x) - 20;
      const chartRight = (bounding && typeof bounding.width === 'number')
        ? chartLeft + bounding.width
        : Math.max(p1.x, p2.x) + 20;

      // Convenience: function to compute Y coordinate from a price value using interpolation
      const priceToY = (price: number) => {
        // Interpolate between p1.y and p2.y according to price position between value1 and value2.
        const ratio = (price - value1) / (value2 - value1);
        // clamp ratio between 0..1 to avoid odd off-chart rendering
        const clamped = Math.max(0, Math.min(1, ratio));
        return p1.y + (p2.y - p1.y) * clamped;
      };

      // Build lines, labels, and zones
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];

        // Compute actual price level
        let priceLevel: number;
        if (isUptrend) {
          // For uptrend: top is value2, 0% = value2, 100% = value1
          priceLevel = value2 - level.value * Math.abs(range);
        } else {
          // For downtrend: top is value1, 0% = value1, 100% = value2
          priceLevel = value1 + level.value * Math.abs(range);
        }

        const levelY = priceToY(priceLevel);

        // Horizontal line spanning full visible chart area
        figures.push({
          key: `fib-line-${level.value}`,
          type: 'line',
          attrs: {
            coordinates: [
              { x: chartLeft, y: levelY },
              { x: chartRight, y: levelY },
            ],
          },
          styles: {
            style: 'dashed',
            size: 1,
            color: level.color,
          },
        });

        // Price label on the left (inside chart)
        figures.push({
          key: `fib-price-${level.value}`,
          type: 'text',
          attrs: {
            x: Math.max(chartLeft + 6, chartLeft), // slight padding from left
            y: levelY,
            text: Number(priceLevel).toFixed(precision?.price ?? 2),
            align: 'left',
            baseline: 'middle',
          },
          styles: {
            color: level.color,
            size: 11,
            family: 'monospace',
            weight: 'normal',
          },
        });

        // Percent label on the right (inside chart)
        figures.push({
          key: `fib-label-${level.value}`,
          type: 'text',
          attrs: {
            x: Math.min(chartRight - 6, chartRight), // slight padding from right
            y: levelY,
            text: level.label,
            align: 'right',
            baseline: 'middle',
          },
          styles: {
            color: level.color,
            size: 12,
            family: 'Arial, sans-serif',
            weight: 'bold',
          },
        });

        // Draw filled zone between this level and the next (if next exists)
        if (i < levels.length - 1) {
          const nextLevel = levels[i + 1];

          // Compute next price and next Y
          let nextPrice: number;
          if (isUptrend) {
            nextPrice = value2 - nextLevel.value * Math.abs(range);
          } else {
            nextPrice = value1 + nextLevel.value * Math.abs(range);
          }
          const nextY = priceToY(nextPrice);

          // Choose a translucent fill color derived from the level color (use rgba)
          // Convert hex (#rrggbb) to rgba with alpha 0.06 for subtle fill.
          const hex = (level.color || '#000000').replace('#', '');
          let fillColor = 'rgba(0,0,0,0.06)';
          if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            fillColor = `rgba(${r},${g},${b},0.06)`;
          }

          figures.push({
            key: `fib-zone-${level.value}`,
            type: 'rect',
            attrs: {
              x: chartLeft,
              // top of rectangle must be min(y1,y2)
              y: Math.min(levelY, nextY),
              width: chartRight - chartLeft,
              height: Math.abs(nextY - levelY),
            },
            styles: {
              style: 'fill',
              color: fillColor,
            },
          });
        }
      }

      return figures;
    },
  });

  // ============================================================
  // 6) LONG POSITION
  // ============================================================
  registerOverlay({
    name: 'longPosition',
    totalStep: 4, // Entry, Stop Loss, Target
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: {
        style: 'solid',
        size: 1,
        color: '#26a69a',
      },
      text: {
        family: 'Arial, sans-serif',
        size: 11,
        color: '#ffffff',
      },
    },

    createPointFigures: ({ coordinates, bounding, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 1) return [];
      if (!overlay || !overlay.points || overlay.points.length < 1) return [];

      const entry = coordinates[0];
      const entryPoint = overlay.points[0];
      const figures: any[] = [];

      // Entry point marker (upward triangle)
      figures.push({
        key: 'long-entry-triangle',
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: entry.x - 6, y: entry.y + 10 },
            { x: entry.x + 6, y: entry.y + 10 },
            { x: entry.x, y: entry.y },
          ],
        },
        styles: {
          style: 'fill',
          color: '#26a69a',
        },
      });

      // Entry control point (draggable circle)
      figures.push({
        key: 'long-entry-point',
        type: 'circle',
        attrs: {
          x: entry.x,
          y: entry.y,
          r: 5,
        },
        styles: {
          style: 'fill_stroke',
          color: '#26a69a',
          borderColor: '#ffffff',
          borderSize: 2,
        },
        ignoreEvent: false,
      });

      // Entry price label
      const entryPrice = entryPoint.value?.toFixed(precision?.price || 2) || '0.00';
      figures.push({
        key: 'long-entry-label',
        type: 'text',
        attrs: {
          x: entry.x + 10,
          y: entry.y - 5,
          text: `LONG ${entryPrice}`,
          align: 'left',
          baseline: 'bottom',
        },
        styles: {
          color: '#26a69a',
          size: 12,
          family: 'Arial, sans-serif',
          weight: 'bold',
        },
      });

      // If we have stop loss (2nd point)
      if (coordinates.length >= 2 && overlay.points.length >= 2) {
        const sl = coordinates[1];
        const slPoint = overlay.points[1];
        const lineExtension = 150; // Limited horizontal extension
        const boxWidth = lineExtension; // Fixed width for all boxes
        const leftX = entry.x; // Always start from entry point
        const rightX = entry.x + boxWidth;

        // Light red background for stop loss zone (SL to Entry)
        figures.push({
          key: 'long-sl-background',
          type: 'rect',
          attrs: {
            x: leftX,
            y: Math.min(entry.y, sl.y),
            width: boxWidth,
            height: Math.abs(sl.y - entry.y),
          },
          styles: {
            style: 'fill',
            color: 'rgba(239, 83, 80, 0.12)',
          },
        });

        // Stop loss line
        figures.push({
          key: 'long-sl-line',
          type: 'line',
          attrs: {
            coordinates: [
              { x: leftX, y: sl.y },
              { x: rightX, y: sl.y },
            ],
          },
          styles: {
            style: 'dashed',
            size: 1,
            color: '#ef5350',
          },
        });

        // SL control point (draggable circle)
        figures.push({
          key: 'long-sl-point',
          type: 'circle',
          attrs: {
            x: sl.x,
            y: sl.y,
            r: 5,
          },
          styles: {
            style: 'fill_stroke',
            color: '#ef5350',
            borderColor: '#ffffff',
            borderSize: 2,
          },
          ignoreEvent: false,
        });

        // SL label
        const slPrice = slPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'long-sl-label',
          type: 'text',
          attrs: {
            x: leftX + 5,
            y: sl.y - 3,
            text: `SL ${slPrice}`,
            align: 'left',
            baseline: 'bottom',
          },
          styles: {
            color: '#ef5350',
            size: 11,
            family: 'Arial, sans-serif',
            weight: 'normal',
          },
        });
      }

      // If we have target (3rd point)
      if (coordinates.length >= 3 && overlay.points.length >= 3) {
        const target = coordinates[2];
        const targetPoint = overlay.points[2];
        const lineExtension = 150; // Limited horizontal extension
        const boxWidth = lineExtension; // Fixed width for all boxes
        const leftX = entry.x; // Always start from entry point
        const rightX = entry.x + boxWidth;

        // Light green background for profit zone (Entry to Target)
        figures.push({
          key: 'long-target-background',
          type: 'rect',
          attrs: {
            x: leftX,
            y: Math.min(entry.y, target.y),
            width: boxWidth,
            height: Math.abs(target.y - entry.y),
          },
          styles: {
            style: 'fill',
            color: 'rgba(38, 166, 154, 0.12)',
          },
        });

        // Target line
        figures.push({
          key: 'long-target-line',
          type: 'line',
          attrs: {
            coordinates: [
              { x: leftX, y: target.y },
              { x: rightX, y: target.y },
            ],
          },
          styles: {
            style: 'dashed',
            size: 1,
            color: '#26a69a',
          },
        });

        // Target control point (draggable circle)
        figures.push({
          key: 'long-target-point',
          type: 'circle',
          attrs: {
            x: target.x,
            y: target.y,
            r: 5,
          },
          styles: {
            style: 'fill_stroke',
            color: '#26a69a',
            borderColor: '#ffffff',
            borderSize: 2,
          },
          ignoreEvent: false,
        });

        // Target label
        const targetPrice = targetPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'long-target-label',
          type: 'text',
          attrs: {
            x: leftX + 5,
            y: target.y + 3,
            text: `TARGET ${targetPrice}`,
            align: 'left',
            baseline: 'top',
          },
          styles: {
            color: '#26a69a',
            size: 11,
            family: 'Arial, sans-serif',
            weight: 'normal',
          },
        });
      }

      return figures;
    },
  });

  // ============================================================
  // 7) SHORT POSITION
  // ============================================================
  registerOverlay({
    name: 'shortPosition',
    totalStep: 4, // Entry, Stop Loss, Target
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: {
        style: 'solid',
        size: 1,
        color: '#ef5350',
      },
      text: {
        family: 'Arial, sans-serif',
        size: 11,
        color: '#ffffff',
      },
    },

    createPointFigures: ({ coordinates, bounding, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 1) return [];
      if (!overlay || !overlay.points || overlay.points.length < 1) return [];

      const entry = coordinates[0];
      const entryPoint = overlay.points[0];
      const figures: any[] = [];

      // Entry point marker (downward triangle)
      figures.push({
        key: 'short-entry-triangle',
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: entry.x - 6, y: entry.y - 10 },
            { x: entry.x + 6, y: entry.y - 10 },
            { x: entry.x, y: entry.y },
          ],
        },
        styles: {
          style: 'fill',
          color: '#ef5350',
        },
      });

      // Entry control point (draggable circle)
      figures.push({
        key: 'short-entry-point',
        type: 'circle',
        attrs: {
          x: entry.x,
          y: entry.y,
          r: 5,
        },
        styles: {
          style: 'fill_stroke',
          color: '#ef5350',
          borderColor: '#ffffff',
          borderSize: 2,
        },
        ignoreEvent: false,
      });

      // Entry price label
      const entryPrice = entryPoint.value?.toFixed(precision?.price || 2) || '0.00';
      figures.push({
        key: 'short-entry-label',
        type: 'text',
        attrs: {
          x: entry.x + 10,
          y: entry.y + 5,
          text: `SHORT ${entryPrice}`,
          align: 'left',
          baseline: 'top',
        },
        styles: {
          color: '#ef5350',
          size: 12,
          family: 'Arial, sans-serif',
          weight: 'bold',
        },
      });

      // If we have stop loss (2nd point)
      if (coordinates.length >= 2 && overlay.points.length >= 2) {
        const sl = coordinates[1];
        const slPoint = overlay.points[1];
        const lineExtension = 150; // Limited horizontal extension
        const boxWidth = lineExtension; // Fixed width for all boxes
        const leftX = entry.x; // Always start from entry point
        const rightX = entry.x + boxWidth;

        // Light green background for stop loss zone (Entry to SL, above entry for short)
        figures.push({
          key: 'short-sl-background',
          type: 'rect',
          attrs: {
            x: leftX,
            y: Math.min(entry.y, sl.y),
            width: boxWidth,
            height: Math.abs(sl.y - entry.y),
          },
          styles: {
            style: 'fill',
            color: 'rgba(38, 166, 154, 0.12)',
          },
        });

        // Stop loss line
        figures.push({
          key: 'short-sl-line',
          type: 'line',
          attrs: {
            coordinates: [
              { x: leftX, y: sl.y },
              { x: rightX, y: sl.y },
            ],
          },
          styles: {
            style: 'dashed',
            size: 1,
            color: '#26a69a',
          },
        });

        // SL control point (draggable circle)
        figures.push({
          key: 'short-sl-point',
          type: 'circle',
          attrs: {
            x: sl.x,
            y: sl.y,
            r: 5,
          },
          styles: {
            style: 'fill_stroke',
            color: '#26a69a',
            borderColor: '#ffffff',
            borderSize: 2,
          },
          ignoreEvent: false,
        });

        // SL label
        const slPrice = slPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'short-sl-label',
          type: 'text',
          attrs: {
            x: leftX + 5,
            y: sl.y + 3,
            text: `SL ${slPrice}`,
            align: 'left',
            baseline: 'top',
          },
          styles: {
            color: '#26a69a',
            size: 11,
            family: 'Arial, sans-serif',
            weight: 'normal',
          },
        });
      }

      // If we have target (3rd point)
      if (coordinates.length >= 3 && overlay.points.length >= 3) {
        const target = coordinates[2];
        const targetPoint = overlay.points[2];
        const lineExtension = 150; // Limited horizontal extension
        const boxWidth = lineExtension; // Fixed width for all boxes
        const leftX = entry.x; // Always start from entry point
        const rightX = entry.x + boxWidth;

        // Light red background for profit zone (Entry to Target, below entry for short)
        figures.push({
          key: 'short-target-background',
          type: 'rect',
          attrs: {
            x: leftX,
            y: Math.min(entry.y, target.y),
            width: boxWidth,
            height: Math.abs(target.y - entry.y),
          },
          styles: {
            style: 'fill',
            color: 'rgba(239, 83, 80, 0.12)',
          },
        });

        // Target line
        figures.push({
          key: 'short-target-line',
          type: 'line',
          attrs: {
            coordinates: [
              { x: leftX, y: target.y },
              { x: rightX, y: target.y },
            ],
          },
          styles: {
            style: 'dashed',
            size: 1,
            color: '#ef5350',
          },
        });

        // Target control point (draggable circle)
        figures.push({
          key: 'short-target-point',
          type: 'circle',
          attrs: {
            x: target.x,
            y: target.y,
            r: 5,
          },
          styles: {
            style: 'fill_stroke',
            color: '#ef5350',
            borderColor: '#ffffff',
            borderSize: 2,
          },
          ignoreEvent: false,
        });

        // Target label
        const targetPrice = targetPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'short-target-label',
          type: 'text',
          attrs: {
            x: leftX + 5,
            y: target.y - 3,
            text: `TARGET ${targetPrice}`,
            align: 'left',
            baseline: 'bottom',
          },
          styles: {
            color: '#ef5350',
            size: 11,
            family: 'Arial, sans-serif',
            weight: 'normal',
          },
        });
      }

      return figures;
    },
  });

  // ============================================================
  // 8) PRICE RANGE
  // ============================================================
  registerOverlay({
    name: 'priceRange',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: {
        style: 'solid',
        size: 1,
        color: '#2962ff',
      },
      polygon: {
        style: 'fill',
        color: 'rgba(41, 98, 255, 0.1)',
      },
    },

    createPointFigures: ({ coordinates, bounding, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      if (!overlay || !overlay.points || overlay.points.length < 2) return [];

      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const point1 = overlay.points[0];
      const point2 = overlay.points[1];

      const figures: any[] = [];

      const topY = Math.min(p1.y, p2.y);
      const bottomY = Math.max(p1.y, p2.y);
      const topValue = Math.max(point1.value, point2.value);
      const bottomValue = Math.min(point1.value, point2.value);

      const chartLeft = bounding?.left || Math.min(p1.x, p2.x) - 50;
      const chartRight = bounding?.width ? chartLeft + bounding.width : Math.max(p1.x, p2.x) + 50;

      // Filled rectangle
      figures.push({
        key: 'priceRange-fill',
        type: 'rect',
        attrs: {
          x: chartLeft,
          y: topY,
          width: chartRight - chartLeft,
          height: bottomY - topY,
        },
        styles: {
          style: 'fill',
          color: 'rgba(41, 98, 255, 0.08)',
        },
      });

      // Top line
      figures.push({
        key: 'priceRange-top',
        type: 'line',
        attrs: {
          coordinates: [
            { x: chartLeft, y: topY },
            { x: chartRight, y: topY },
          ],
        },
        styles: {
          style: 'solid',
          size: 1,
          color: '#2962ff',
        },
      });

      // Bottom line
      figures.push({
        key: 'priceRange-bottom',
        type: 'line',
        attrs: {
          coordinates: [
            { x: chartLeft, y: bottomY },
            { x: chartRight, y: bottomY },
          ],
        },
        styles: {
          style: 'solid',
          size: 1,
          color: '#2962ff',
        },
      });

      // Price difference label
      const priceDiff = (topValue - bottomValue).toFixed(precision?.price || 2);
      const percentage = (((topValue - bottomValue) / bottomValue) * 100).toFixed(2);
      
      figures.push({
        key: 'priceRange-label',
        type: 'text',
        attrs: {
          x: chartLeft + 10,
          y: topY + (bottomY - topY) / 2,
          text: `${priceDiff} (${percentage}%)`,
          align: 'left',
          baseline: 'middle',
        },
        styles: {
          color: '#2962ff',
          size: 12,
          family: 'Arial, sans-serif',
          weight: 'bold',
        },
      });

      return figures;
    },
  });

  // ============================================================
  // 9) DATE RANGE
  // ============================================================
  registerOverlay({
    name: 'dateRange',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: {
        style: 'solid',
        size: 1,
        color: '#9c27b0',
      },
      polygon: {
        style: 'fill',
        color: 'rgba(156, 39, 176, 0.1)',
      },
    },

    createPointFigures: ({ coordinates, bounding, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      if (!overlay || !overlay.points || overlay.points.length < 2) return [];

      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const point1 = overlay.points[0];
      const point2 = overlay.points[1];

      const figures: any[] = [];

      const leftX = Math.min(p1.x, p2.x);
      const rightX = Math.max(p1.x, p2.x);

      const chartTop = bounding?.top || 0;
      const chartBottom = bounding?.height ? chartTop + bounding.height : 500;

      // Filled rectangle
      figures.push({
        key: 'dateRange-fill',
        type: 'rect',
        attrs: {
          x: leftX,
          y: chartTop,
          width: rightX - leftX,
          height: chartBottom - chartTop,
        },
        styles: {
          style: 'fill',
          color: 'rgba(156, 39, 176, 0.08)',
        },
      });

      // Left line
      figures.push({
        key: 'dateRange-left',
        type: 'line',
        attrs: {
          coordinates: [
            { x: leftX, y: chartTop },
            { x: leftX, y: chartBottom },
          ],
        },
        styles: {
          style: 'solid',
          size: 1,
          color: '#9c27b0',
        },
      });

      // Right line
      figures.push({
        key: 'dateRange-right',
        type: 'line',
        attrs: {
          coordinates: [
            { x: rightX, y: chartTop },
            { x: rightX, y: chartBottom },
          ],
        },
        styles: {
          style: 'solid',
          size: 1,
          color: '#9c27b0',
        },
      });

      // Calculate time difference in bars
      const barDiff = Math.abs((point2.dataIndex || 0) - (point1.dataIndex || 0));
      
      figures.push({
        key: 'dateRange-label',
        type: 'text',
        attrs: {
          x: leftX + (rightX - leftX) / 2,
          y: chartTop + 20,
          text: `${barDiff} bars`,
          align: 'center',
          baseline: 'top',
        },
        styles: {
          color: '#9c27b0',
          size: 12,
          family: 'Arial, sans-serif',
          weight: 'bold',
        },
      });

      return figures;
    },
  });

  // ============================================================
  // 10) DATE AND PRICE RANGE (Combined Box)
  // ============================================================
  registerOverlay({
    name: 'datePriceRange',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      rect: {
        style: 'stroke_fill',
        color: 'rgba(255, 152, 0, 0.08)',
        borderColor: '#ff9800',
        borderSize: 1,
      },
    },

    createPointFigures: ({ coordinates, bounding, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      if (!overlay || !overlay.points || overlay.points.length < 2) return [];

      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const point1 = overlay.points[0];
      const point2 = overlay.points[1];

      const figures: any[] = [];

      const leftX = Math.min(p1.x, p2.x);
      const rightX = Math.max(p1.x, p2.x);
      const topY = Math.min(p1.y, p2.y);
      const bottomY = Math.max(p1.y, p2.y);

      const topValue = Math.max(point1.value, point2.value);
      const bottomValue = Math.min(point1.value, point2.value);

      // Box
      figures.push({
        key: 'datePriceRange-box',
        type: 'rect',
        attrs: {
          x: leftX,
          y: topY,
          width: rightX - leftX,
          height: bottomY - topY,
        },
        styles: {
          style: 'stroke_fill',
          color: 'rgba(255, 152, 0, 0.08)',
          borderColor: '#ff9800',
          borderSize: 1.5,
        },
      });

      // Price difference
      const priceDiff = (topValue - bottomValue).toFixed(precision?.price || 2);
      const percentage = (((topValue - bottomValue) / bottomValue) * 100).toFixed(2);
      
      figures.push({
        key: 'datePriceRange-price-label',
        type: 'text',
        attrs: {
          x: leftX + 5,
          y: topY + 5,
          text: `${priceDiff} (${percentage}%)`,
          align: 'left',
          baseline: 'top',
        },
        styles: {
          color: '#ff9800',
          size: 11,
          family: 'Arial, sans-serif',
          weight: 'bold',
        },
      });

      // Time difference
      const barDiff = Math.abs((point2.dataIndex || 0) - (point1.dataIndex || 0));
      
      figures.push({
        key: 'datePriceRange-time-label',
        type: 'text',
        attrs: {
          x: rightX - 5,
          y: bottomY - 5,
          text: `${barDiff} bars`,
          align: 'right',
          baseline: 'bottom',
        },
        styles: {
          color: '#ff9800',
          size: 11,
          family: 'Arial, sans-serif',
          weight: 'bold',
        },
      });

      return figures;
    },
  });
}
