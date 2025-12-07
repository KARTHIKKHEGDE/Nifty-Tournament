// frontend/lib/klineOverlays.ts
// Rewritten overlays file with fully editable rotated rectangle (rotate handle + 4 corners + drag)
// and other overlays (rectBox, freeBrush, trendLine, fibonacciRetracement, long/short, priceRange, dateRange, datePriceRange).
// Author: ChatGPT (prepared for KlineCharts-like overlay registration)

let overlaysRegistered = false;

export function registerCustomOverlays(klinecharts: any) {
  if (!klinecharts || overlaysRegistered) return;
  overlaysRegistered = true;

  const { registerOverlay } = klinecharts;

  // -------------------------
  // Helpers / geometry utils
  // -------------------------
  function vec(x: number, y: number) { return { x, y }; }
  function add(a: any, b: any) { return { x: a.x + b.x, y: a.y + b.y }; }
  function sub(a: any, b: any) { return { x: a.x - b.x, y: a.y - b.y }; }
  function mul(a: any, s: number) { return { x: a.x * s, y: a.y * s }; }
  function len(a: any) { return Math.sqrt(a.x * a.x + a.y * a.y); }
  function norm(a: any) {
    const L = len(a) || 1;
    return { x: a.x / L, y: a.y / L };
  }
  function perpendicular(a: any) { return { x: -a.y, y: a.x }; }
  function mid(a: any, b: any) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  function rotateAround(p: any, center: any, angleRad: number) {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    const ca = Math.cos(angleRad);
    const sa = Math.sin(angleRad);
    return {
      x: center.x + dx * ca - dy * sa,
      y: center.y + dx * sa + dy * ca,
    };
  }

  // Compute rectangle corners given base p0->p1 and signed height
  function getRectCornersFromBaseAndHeight(p0: any, p1: any, signedHeight: number) {
    const v = sub(p1, p0);
    const baseLen = len(v) || 1;
    const unit = { x: v.x / baseLen, y: v.y / baseLen };
    const perp = { x: -unit.y, y: unit.x }; // unit perpendicular
    const hx = perp.x * signedHeight;
    const hy = perp.y * signedHeight;
    const c1 = { x: p0.x, y: p0.y };
    const c2 = { x: p1.x, y: p1.y };
    const c3 = { x: p1.x + hx, y: p1.y + hy };
    const c4 = { x: p0.x + hx, y: p0.y + hy };
    return [c1, c2, c3, c4];
  }

  // Compute signed height from a mouse point (mouseP) relative to base p0->p1
  function computeSignedHeight(p0: any, p1: any, mouseP: any) {
    const v = sub(p1, p0);
    const baseLen = len(v) || 1;
    const perp = { x: -v.y / baseLen, y: v.x / baseLen }; // normalized perpendicular
    const m = sub(mouseP, p1); // vector from p1 to mouse
    // height is dot(m, perp) — sign preserves side
    return m.x * perp.x + m.y * perp.y;
  }

  // Snap small values to zero for stability
  function almostZero(n: number, eps = 1e-6) {
    return Math.abs(n) < eps ? 0 : n;
  }

  // Convenience: safeReadCoord - fallback when overlay provides only points (value/dataIndex)
  function safeCoord(pt: any) {
    return { x: pt.x ?? pt.clientX ?? 0, y: pt.y ?? pt.clientY ?? 0, value: pt.value, dataIndex: pt.dataIndex };
  }

  // ------------------------------------------------------
  // 1) NORMAL RECTANGLE (rectBox) - editable using default points
  // ------------------------------------------------------
  registerOverlay({
    name: 'rectBox',
    totalStep: 3,
    needDefaultPointFigure: true,
    styles: {
      rect: {
        style: 'stroke_fill',
        color: 'rgba(3,169,244,0.06)',
        borderColor: '#03a9f4',
        borderSize: 1,
      },
    },
    createPointFigures: ({ coordinates }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p2.y - p1.y);
      if (width === 0 || height === 0) return [];
      return [
        {
          key: 'rectBox-main',
          type: 'rect',
          attrs: { x, y, width, height },
          styles: {
            style: 'stroke_fill',
            color: 'rgba(3,169,244,0.06)',
            borderColor: '#03a9f4',
            borderSize: 1,
          },
        },
      ];
    },

    // allow default point dragging - klinecharts will call overlay.onPointMove when user drags a point
    onPointMove: ({ overlay, pointIndex, performPoint }: any) => {
      // When user drags a control point (p0 or p1), we update overlay.points automatically.
      // The chart engine usually handles replacing the point. We return true to indicate we handled it.
      // If your klinecharts requires manual change, uncomment this block and copy performPoint to overlay.points[pointIndex].
      // if (overlay && overlay.points && performPoint) {
      //   overlay.points[pointIndex] = { ...performPoint };
      // }
      return true;
    },
  });

  // ------------------------------------------------------
  // 2) FREE BRUSH (editable freehand)
  // ------------------------------------------------------
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
        x: performPoint.x,
        y: performPoint.y,
      });
    },
    // Allow dragging the whole brush path
    onPointMove: ({ overlay, pointIndex, performPoint }: any) => {
      // For simplicity: allow moving each point individually (chart engine may already do this)
      return true;
    },
  });

  // ------------------------------------------------------
  // 3) ROTATED RECTANGLE (rotatedRect) — fully editable
  //    - totalStep: user places p0 (base start), p1 (base end), p2 (mouse to define height) ; after finishing we'll transform coordinates into 4 corner handles + rotate handle.
  //    - Implementation:
  //       overlay.points will store:
  //         0 = base start (p0)
  //         1 = base end (p1)
  //         2 = corner3 (p1 + perp * signedHeight)  <-- stored to keep behavior consistent
  //       After finishing, createPointFigures will compute the 4 corners, additional rotate handle coordinate, and will override the coordinates used for drawn corners (so interactive points are placed exactly at corners).
  //    - onPointMove will handle drags of each handle and whole-shape drag.
  // ------------------------------------------------------
  registerOverlay({
    name: 'rotatedRect',
    totalStep: 4, // p0, p1, p2 + finish
    needDefaultPointFigure: true,
    styles: {
      polygon: {
        style: 'stroke_fill',
        color: 'rgba(129,212,250,0.10)',
        borderColor: '#29b6f6',
        borderSize: 1,
      },
      point: {
        radius: 5,
        style: 'fill_stroke',
        color: '#29b6f6',
        borderColor: '#ffffff',
        borderSize: 2,
      },
      rotateHandle: {
        radius: 5,
        color: '#29b6f6',
        borderColor: '#ffffff',
      },
    },

    createPointFigures: ({ coordinates, overlay }: any) => {
      // If 1 point: show dashed line from p0 to mouse
      if (!coordinates || coordinates.length === 0) return [];

      // Step handling while drawing:
      if (coordinates.length === 1) {
        return [
          {
            key: 'rotatedRect-temp-line',
            type: 'line',
            attrs: { coordinates },
            styles: { style: 'dashed', size: 1, color: '#29b6f6' },
          },
        ];
      }

      if (coordinates.length === 2) {
        // show base line (dashed)
        return [
          {
            key: 'rotatedRect-temp-line',
            type: 'line',
            attrs: { coordinates },
            styles: { style: 'dashed', size: 1, color: '#29b6f6' },
          },
        ];
      }

      // When we have at least 3 coordinates, build full rectangle
      // coordinates[]: [p0, p1, p2] — but p2 may be raw mouse; we will compute the true corner3 projection and replace coordinates[2] with it so the chart engine places actual control point at projected corner.
      const rawP0 = coordinates[0];
      const rawP1 = coordinates[1];
      const rawP2 = coordinates[2];

      // compute signed height from mouse point
      const signedHeight = computeSignedHeight(rawP0, rawP1, rawP2);
      const height = signedHeight; // keep sign to preserve side

      // compute rectangle corners
      const [c1, c2, c3, c4] = getRectCornersFromBaseAndHeight(rawP0, rawP1, height);

      // store projected corner3 into coordinates[2] so the control point appears at the correct rectangle corner
      coordinates[2] = { ...c3, value: rawP2.value, dataIndex: rawP2.dataIndex };

      // rotation handle: place at center-top (midpoint of c1 and c2) plus outward perpendicular offset
      const topMid = mid(c1, c2);
      const baseVec = sub(c2, c1);
      const baseLen = len(baseVec) || 1;
      const perpUnit = { x: -baseVec.y / baseLen, y: baseVec.x / baseLen };
      const rotateHandleOffset = Math.max(18, Math.min(40, baseLen * 0.12)); // px offset for handle
      const rotateHandle = add(topMid, mul(perpUnit, -rotateHandleOffset)); // outward above the top edge

      // Save meta (not drawn) for onPointMove to reference
      if (overlay) {
        overlay.__rectMeta = { corners: [c1, c2, c3, c4], rotateHandle, signedHeight };
      }

      // Build polygon figure for the rectangle
      const poly = {
        key: 'rotatedRect-poly',
        type: 'polygon',
        attrs: { coordinates: [c1, c2, c3, c4] },
        styles: {
          style: 'stroke_fill',
          color: 'rgba(129,212,250,0.10)',
          borderColor: '#29b6f6',
          borderSize: 1,
        },
      };

      // Build corner handles and rotate handle as separate figures so they can be interacted with
      const cornersFigures = [poly];

      // control points (corners) - type circle
      [c1, c2, c3, c4].forEach((pt: any, i: number) => {
        cornersFigures.push({
          key: `rotatedRect-corner-${i}`,
          type: 'circle',
          attrs: { x: pt.x, y: pt.y, r: 5 } as any,
          styles: { style: 'fill_stroke', color: '#29b6f6', borderColor: '#ffffff', borderSize: 2 },
          // We intentionally do NOT set ignoreEvent: true so chart's point interactions can work
        });
      });

      // rotate handle (draw as circle)
      cornersFigures.push({
        key: 'rotatedRect-rotate-handle',
        type: 'circle',
        attrs: { x: rotateHandle.x, y: rotateHandle.y, r: 6 } as any,
        styles: { style: 'fill_stroke', color: '#29b6f6', borderColor: '#ffffff', borderSize: 2 },
      } as any);

      return cornersFigures;
    },

    // handle dragging / editing:
    // - If user drags any of the 4 corner points: update the rectangle by recalculating base and height accordingly
    // - If user drags the rotate handle: rotate rectangle about its center
    // - If user drags the shape body (performEventPressedMove with drag start on background): translate whole rectangle
    onPointMove: ({ overlay, pointIndex, performPoint, chart }: any) => {
      // overlay.points may be [p0, p1, p2] OR corners if the engine replaces them.
      // We stored overlay.__rectMeta earlier with corners and rotateHandle to help compute transforms.
      if (!overlay) return true;
      const meta = overlay.__rectMeta || {};
      const corners = meta.corners || [];
      const rotateHandle = meta.rotateHandle;

      // We need a robust way to map which handle user dragged:
      // The chart engine's pointIndex might map to overlay.points index (0..n). We'll infer by comparing proximity to corners and rotateHandle.
      // Best-effort:
      const dragged = performPoint || overlay.points?.[pointIndex];
      if (!dragged) return true;

      // Determine which action: corner, rotate, or whole-shape
      const pt = { x: dragged.x, y: dragged.y };
      let nearestCornerIndex = -1;
      let nearestCornerDist = Infinity;
      for (let i = 0; i < corners.length; i++) {
        const d = len(sub(corners[i], pt));
        if (d < nearestCornerDist) { nearestCornerDist = d; nearestCornerIndex = i; }
      }
      const rotateDist = rotateHandle ? len(sub(rotateHandle, pt)) : Infinity;

      const CORNER_THRESHOLD = 12;
      const ROTATE_THRESHOLD = 14;

      if (rotateDist < ROTATE_THRESHOLD && rotateDist < nearestCornerDist) {
        // Rotate handle dragged: compute angle from center to new rotate pos and rotate the rectangle
        const center = { x: (corners[0].x + corners[2].x) / 2, y: (corners[0].y + corners[2].y) / 2 };
        const newRotateVec = sub(pt, center);
        const baseVec = sub(corners[1], corners[0]);
        const oldAngle = Math.atan2(baseVec.y, baseVec.x);
        const newAngle = Math.atan2(-newRotateVec.y, newRotateVec.x); // negative because rotate handle is above
        const angleDelta = newAngle - oldAngle;

        // rotate each corner around center
        const newCorners = corners.map((c: any) => rotateAround(c, center, angleDelta));
        // compute new signedHeight using projection
        const newBase = sub(newCorners[1], newCorners[0]);
        const newBaseLen = len(newBase) || 1;
        const newPerp = { x: -newBase.y / newBaseLen, y: newBase.x / newBaseLen };
        // keep same absolute height
        const signedHeight = meta.signedHeight ?? computeSignedHeight(newCorners[0], newCorners[1], newCorners[2] || newCorners[1]);
        const newC3 = add(newCorners[1], mul(newPerp, signedHeight));
        // update overlay.points such that p0/p1/p2 map to new base and projected corner3 so edit persists
        overlay.points[0] = { ...overlay.points[0], x: newCorners[0].x, y: newCorners[0].y };
        overlay.points[1] = { ...overlay.points[1], x: newCorners[1].x, y: newCorners[1].y };
        overlay.points[2] = { ...overlay.points[2], x: newC3.x, y: newC3.y };
        return true;
      }

      if (nearestCornerDist < CORNER_THRESHOLD) {
        // User dragged corner i -> update rectangle such that that corner moves to pt.
        // We'll support dragging any corner:
        // - If corner 0 or 1 (base corners) moved: update base positions accordingly, recompute height by projecting previous c3 onto new base perpendicular
        // - If corner 2 or 3 moved: compute new signedHeight from new corner to base.
        const i = nearestCornerIndex;
        const oldCorners = corners;
        let newP0 = { ...oldCorners[0] }, newP1 = { ...oldCorners[1] }, newHeight = meta.signedHeight || 0;

        if (i === 0) {
          // moved corner1 => set p0 to pt, p1 remains; recompute height using old p3 projection onto new base
          newP0 = { x: pt.x, y: pt.y };
          newP1 = oldCorners[1];
          // recompute height from old c3
          const projectedHeight = computeSignedHeight(newP0, newP1, oldCorners[2]);
          newHeight = projectedHeight;
        } else if (i === 1) {
          newP0 = oldCorners[0];
          newP1 = { x: pt.x, y: pt.y };
          const projectedHeight = computeSignedHeight(newP0, newP1, oldCorners[2]);
          newHeight = projectedHeight;
        } else if (i === 2) {
          // moved corner3 -> derive signedHeight relative to base (p0,p1)
          newP0 = oldCorners[0];
          newP1 = oldCorners[1];
          newHeight = computeSignedHeight(newP0, newP1, pt);
        } else if (i === 3) {
          newP0 = oldCorners[0];
          newP1 = oldCorners[1];
          // corner4 moved: compute height from corner4 => it's equivalent to compute from corner3 mirrored: find perp from base, compute signed value
          // A robust way: derive perpendicular projection of pt onto base normal
          // Compute signed height using appropriate corner point: for c4, consider its corresponding p2 would be c3, so compute height from c4 minus p0
          const base = sub(newP1, newP0);
          const baseLen = len(base) || 1;
          const perpUnit = { x: -base.y / baseLen, y: base.x / baseLen };
          // Signed height approximation: dot(pt - p0, perpUnit)
          const signed = (pt.x - newP0.x) * perpUnit.x + (pt.y - newP0.y) * perpUnit.y;
          newHeight = signed;
        }

        // compute new corners from newP0/newP1/newHeight
        const [nc1, nc2, nc3, nc4] = getRectCornersFromBaseAndHeight(newP0, newP1, newHeight);

        // update overlay.points (persist into p0,p1,p2)
        overlay.points[0] = { ...(overlay.points[0] || {}), x: nc1.x, y: nc1.y };
        overlay.points[1] = { ...(overlay.points[1] || {}), x: nc2.x, y: nc2.y };
        overlay.points[2] = { ...(overlay.points[2] || {}), x: nc3.x, y: nc3.y };

        return true;
      }

      // If none of the above - fallback: let chart engine handle dragging (or handle whole-shape translate)
      return true;
    },

    // Allow dragging the whole shape by pressing and moving in background
    performEventPressedMove: ({ overlay, points, performPoint }: any) => {
      // If user is dragging background while overlay has points, translate the entire shape by mouse delta
      if (!overlay || !overlay.points || overlay.points.length < 3) {
        return true; // Need at least 3 points for the shape to exist
      }

      if (!overlay.__dragStart) {
        // If drag start is not stored, store initial mouse pos and corners
        overlay.__dragStart = { start: performPoint ? { x: performPoint.x, y: performPoint.y } : null, originalPoints: overlay.points.map((p: any) => ({ ...p })) };
        return true;
      }

      const start = overlay.__dragStart?.start;
      const original = overlay.__dragStart?.originalPoints;
      if (!start || !original || !performPoint) return true;

      const dx = performPoint.x - start.x;
      const dy = performPoint.y - start.y;

      // shift each stored original point by dx/dy
      for (let i = 0; i < original.length; i++) {
        overlay.points[i] = { ...(overlay.points[i] || {}), x: original[i].x + dx, y: original[i].y + dy };
      }
      return true;
    },

    // Clear drag state on released (chart engine may call another event; putting a simple cleanup call)
    onPressedUp: ({ overlay }: any) => {
      if (overlay) {
        delete overlay.__dragStart;
        // recompute meta
        if (overlay.points && overlay.points.length >= 3) {
          const p0 = overlay.points[0];
          const p1 = overlay.points[1];
          const p2 = overlay.points[2];
          const signedHeight = computeSignedHeight(p0, p1, p2);
          overlay.__rectMeta = { corners: getRectCornersFromBaseAndHeight(p0, p1, signedHeight), signedHeight };
        }
      }
      return true;
    },

    // When finishing drawing (double click), ensure last preview point removed
    onDoubleClick: ({ overlay }: any) => {
      if (overlay && overlay.points && overlay.points.length > 2) {
        // remove possible preview point
        overlay.points.pop();
        // compute meta
        const p0 = overlay.points[0];
        const p1 = overlay.points[1];
        const p2 = overlay.points[2];
        const signedHeight = computeSignedHeight(p0, p1, p2);
        overlay.__rectMeta = { corners: getRectCornersFromBaseAndHeight(p0, p1, signedHeight), signedHeight };
      }
      return true;
    },
  });

  // ------------------------------------------------------
  // 4) MULTI-POINT TREND LINE (trendLine) - editable points & preview
  // ------------------------------------------------------
  registerOverlay({
    name: 'trendLine',
    totalStep: 100,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: { style: 'solid', size: 2, color: '#2962ff' },
      point: {
        backgroundColor: '#2962ff',
        borderColor: '#ffffff',
        borderSize: 2,
        radius: 5,
      },
    },
    createPointFigures: ({ coordinates }: any) => {
      if (!coordinates || coordinates.length === 0) return [];
      const figures: any[] = [];
      if (coordinates.length >= 2) {
        figures.push({
          key: 'trendLine-main',
          type: 'line',
          attrs: { coordinates },
          styles: { style: 'solid', size: 2, color: '#2962ff' },
        });
      }
      coordinates.forEach((point: any, index: number) => {
        figures.push({
          key: `trendLine-point-${index}`,
          type: 'circle',
          attrs: { x: point.x, y: point.y, r: 5 },
          styles: { style: 'fill_stroke', color: '#2962ff', borderColor: '#ffffff', borderSize: 2 },
          ignoreEvent: false,
        });
      });
      return figures;
    },
    performEventMoveForDrawing: ({ currentStep, points, performPoint }: any) => {
      if (!performPoint) return;
      if (currentStep > 1 && points.length > 0) {
        points[points.length - 1] = { ...performPoint };
      }
    },
    performEventPressedDrawing: ({ currentStep, points, performPoint, overlay }: any) => {
      if (!performPoint) return;
      const newPoint = { ...performPoint };
      points.push(newPoint);
      if (currentStep < (overlay.totalStep - 1)) points.push({ ...newPoint });
      return true;
    },
    onDoubleClick: ({ overlay }: any) => {
      if (overlay && overlay.points && overlay.points.length > 1) overlay.points.pop();
      return true;
    },
  });

  // ------------------------------------------------------
  // 5) FIBONACCI RETRACEMENT
  // ------------------------------------------------------
  registerOverlay({
    name: 'fibonacciRetracement',
    totalStep: 2,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: { style: 'dashed', size: 1, color: '#00baff' },
      point: { backgroundColor: '#00baff', borderColor: '#ffffff', borderSize: 2, radius: 5 },
      text: { family: 'monospace', size: 11 },
    },
    createPointFigures: ({ coordinates, bounding, precision }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      if (p1.value == null || p2.value == null) return [];
      const figures: any[] = [];
      const levels = [
        { value: 0, label: '0%', color: '#787b86' },
        { value: 0.236, label: '23.6%', color: '#f23645' },
        { value: 0.382, label: '38.2%', color: '#ff9800' },
        { value: 0.5, label: '50%', color: '#fbc02d' },
        { value: 0.618, label: '61.8%', color: '#00baff' },
        { value: 0.786, label: '78.6%', color: '#9c27b0' },
        { value: 1, label: '100%', color: '#787b86' },
      ];
      const value1 = p1.value;
      const value2 = p2.value;
      const range = value2 - value1;
      if (range === 0) return [];
      const isUptrend = value2 > value1;
      const chartLeft = (bounding && typeof bounding.left === 'number') ? bounding.left : Math.min(p1.x, p2.x) - 20;
      const chartRight = (bounding && typeof bounding.width === 'number') ? chartLeft + bounding.width : Math.max(p1.x, p2.x) + 20;
      const priceToY = (price: number) => {
        const ratio = (price - value1) / (value2 - value1);
        const clamped = Math.max(0, Math.min(1, ratio));
        return p1.y + (p2.y - p1.y) * clamped;
      };
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        let priceLevel: number;
        if (isUptrend) priceLevel = value2 - level.value * Math.abs(range);
        else priceLevel = value1 + level.value * Math.abs(range);
        const levelY = priceToY(priceLevel);
        figures.push({
          key: `fib-line-${level.value}`,
          type: 'line',
          attrs: { coordinates: [{ x: chartLeft, y: levelY }, { x: chartRight, y: levelY }] },
          styles: { style: 'dashed', size: 1, color: level.color },
        });
        figures.push({
          key: `fib-price-${level.value}`,
          type: 'text',
          attrs: { x: chartLeft + 6, y: levelY, text: Number(priceLevel).toFixed(precision?.price ?? 2), align: 'left', baseline: 'middle' },
          styles: { color: level.color, size: 11, family: 'monospace' },
        });
        figures.push({
          key: `fib-label-${level.value}`,
          type: 'text',
          attrs: { x: chartRight - 6, y: levelY, text: level.label, align: 'right', baseline: 'middle' },
          styles: { color: level.color, size: 12, family: 'Arial, sans-serif', weight: 'bold' },
        });

        if (i < levels.length - 1) {
          const nextLevel = levels[i + 1];
          let nextPrice: number;
          if (isUptrend) nextPrice = value2 - nextLevel.value * Math.abs(range);
          else nextPrice = value1 + nextLevel.value * Math.abs(range);
          const nextY = priceToY(nextPrice);
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
            attrs: { x: chartLeft, y: Math.min(levelY, nextY), width: chartRight - chartLeft, height: Math.abs(nextY - levelY) },
            styles: { style: 'fill', color: fillColor },
          });
        }
      }
      return figures;
    },
    onPointMove: ({ overlay }: any) => {
      // Keep interactive: the engine handles point movement; we return true
      return true;
    }
  });

  // ------------------------------------------------------
  // 6) LONG POSITION (4-point system with projection)
  // Point 0: Entry Left, Point 1: Entry Right (width), Point 2: SL, Point 3: Target
  // All points are projected to their correct positions (not raw mouse)
  // ------------------------------------------------------
  registerOverlay({
    name: 'longPosition',
    totalStep: 5,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: { style: 'solid', size: 1, color: '#26a69a' },
      text: { family: 'Arial, sans-serif', size: 11, color: '#ffffff' },
      point: { radius: 5 },
    },

    createPointFigures: ({ coordinates, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      if (!overlay || !overlay.points || overlay.points.length < 2) return [];

      // PROJECT all points to their correct positions
      const p0 = overlay.points[0];

      // Point 1: Project horizontally (same Y/value as p0, different X/dataIndex)
      if (overlay.points.length >= 2) {
        const rawP1 = overlay.points[1];
        coordinates[1] = {
          ...coordinates[1],
          y: coordinates[0].y,  // Lock to entry Y
        };
        overlay.points[1] = {
          ...rawP1,
          value: p0.value,  // Lock to entry price
        };
      }

      // Point 2 (SL): Project vertically (same X/dataIndex as p0, different Y/value)
      if (overlay.points.length >= 3) {
        const rawP2 = overlay.points[2];
        coordinates[2] = {
          ...coordinates[2],
          x: coordinates[0].x,  // Lock to entry X
        };
        overlay.points[2] = {
          ...rawP2,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }

      // Point 3 (Target): Project vertically (same X/dataIndex as p0, different Y/value)
      if (overlay.points.length >= 4) {
        const rawP3 = overlay.points[3];
        coordinates[3] = {
          ...coordinates[3],
          x: coordinates[0].x,  // Lock to entry X
        };
        overlay.points[3] = {
          ...rawP3,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }

      const figures: any[] = [];
      const entryLeft = coordinates[0];
      const entryRight = coordinates[1];
      const entryLeftPoint = overlay.points[0];

      const leftX = entryLeft.x;
      const rightX = entryRight.x;
      const boxWidth = rightX - leftX;
      const entryY = entryLeft.y;

      // Entry triangle marker at left point
      figures.push({
        key: 'long-entry-triangle',
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: entryLeft.x - 6, y: entryY + 10 },
            { x: entryLeft.x + 6, y: entryY + 10 },
            { x: entryLeft.x, y: entryY }
          ]
        },
        styles: { style: 'fill', color: '#26a69a' },
      });

      // Entry line (horizontal line connecting left and right points)
      figures.push({
        key: 'long-entry-line',
        type: 'line',
        attrs: { coordinates: [{ x: leftX, y: entryY }, { x: rightX, y: entryY }] },
        styles: { style: 'solid', size: 2, color: '#26a69a' },
      });

      // Stop Loss (point 2)
      if (coordinates.length >= 3 && overlay.points.length >= 3) {
        const sl = coordinates[2];
        const slPoint = overlay.points[2];

        figures.push({
          key: 'long-sl-background',
          type: 'rect',
          attrs: { x: leftX, y: Math.min(entryY, sl.y), width: boxWidth, height: Math.abs(sl.y - entryY) },
          styles: { style: 'fill', color: 'rgba(239,83,80,0.12)' },
        });
        figures.push({
          key: 'long-sl-line',
          type: 'line',
          attrs: { coordinates: [{ x: leftX, y: sl.y }, { x: rightX, y: sl.y }] },
          styles: { style: 'dashed', size: 1, color: '#ef5350' },
        });

        const slPrice = slPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'long-sl-label',
          type: 'text',
          attrs: { x: leftX + 5, y: sl.y - 3, text: `SL ${slPrice}`, align: 'left', baseline: 'bottom' },
          styles: { color: '#ffffff', size: 11, family: 'Arial, sans-serif' },
        });
      }

      // Target (point 3)
      if (coordinates.length >= 4 && overlay.points.length >= 4) {
        const target = coordinates[3];
        const targetPoint = overlay.points[3];

        figures.push({
          key: 'long-target-background',
          type: 'rect',
          attrs: { x: leftX, y: Math.min(entryY, target.y), width: boxWidth, height: Math.abs(target.y - entryY) },
          styles: { style: 'fill', color: 'rgba(38,166,154,0.12)' },
        });
        figures.push({
          key: 'long-target-line',
          type: 'line',
          attrs: { coordinates: [{ x: leftX, y: target.y }, { x: rightX, y: target.y }] },
          styles: { style: 'dashed', size: 1, color: '#26a69a' },
        });

        const targetPrice = targetPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'long-target-label',
          type: 'text',
          attrs: { x: leftX + 5, y: target.y + 3, text: `TARGET ${targetPrice}`, align: 'left', baseline: 'top' },
          styles: { color: '#ffffff', size: 11, family: 'Arial, sans-serif' },
        });

        // Calculate and display Risk-Reward Ratio
        const slPoint = overlay.points[2];
        const entryValue = entryLeftPoint.value || 0;
        const slValue = slPoint.value || 0;
        const targetValue = targetPoint.value || 0;

        const risk = Math.abs(entryValue - slValue);
        const reward = Math.abs(targetValue - entryValue);
        const rrRatio = risk > 0 ? (reward / risk).toFixed(2) : '0.00';

        const rrBoxX = entryLeft.x + 10;
        const rrBoxY = entryY - 30;
        const rrText = `R:R 1:${rrRatio}`;

        figures.push({
          key: 'long-rr-box',
          type: 'rect',
          attrs: { x: rrBoxX, y: rrBoxY - 8, width: 85, height: 20 },
          styles: { style: 'fill', color: '#2962ff' },
        });

        figures.push({
          key: 'long-rr-text',
          type: 'text',
          attrs: { x: rrBoxX + 42.5, y: rrBoxY + 2, text: rrText, align: 'center', baseline: 'middle' },
          styles: { color: '#ffffff', size: 12, family: 'Arial, sans-serif', weight: 'bold' },
        });
      }

      return figures;
    },

    onPointMove: ({ overlay, pointIndex, performPoint }: any) => {
      if (!overlay || !overlay.points || !performPoint) return true;

      const entryLeft = overlay.points[0];
      const entryRight = overlay.points[1];

      // Point 0 (entry-left): Only horizontal movement, lock to entry Y/value
      if (pointIndex === 0 && overlay.points.length >= 2) {
        overlay.points[0] = {
          ...overlay.points[0],
          x: performPoint.x,
          y: entryRight.y,  // Lock to entry Y
          dataIndex: performPoint.dataIndex,
          value: entryRight.value,  // Lock to entry price
        };
      }

      // Point 1 (entry-right): Only horizontal movement, lock to entry Y/value
      if (pointIndex === 1 && overlay.points.length >= 2) {
        overlay.points[1] = {
          ...overlay.points[1],
          x: performPoint.x,
          y: entryLeft.y,  // Lock to entry Y
          dataIndex: performPoint.dataIndex,
          value: entryLeft.value,  // Lock to entry price
        };
      }

      // Point 2 (SL): only vertical movement, lock to entry X
      if (pointIndex === 2 && overlay.points.length >= 3) {
        overlay.points[2] = {
          ...overlay.points[2],
          x: entryLeft.x,
          y: performPoint.y,
          dataIndex: entryLeft.dataIndex,
          value: performPoint.value,
        };
      }

      // Point 3 (Target): only vertical movement, lock to entry X
      if (pointIndex === 3 && overlay.points.length >= 4) {
        overlay.points[3] = {
          ...overlay.points[3],
          x: entryLeft.x,
          y: performPoint.y,
          dataIndex: entryLeft.dataIndex,
          value: performPoint.value,
        };
      }

      return true;
    },

    performEventMoveForDrawing: ({ currentStep, points, performPoint }: any) => {
      if (!performPoint || !points || points.length === 0) return;

      const p0 = points[0];

      // Step 2: Drawing width (Point 1) - project horizontally
      if (currentStep === 2 && points.length >= 2) {
        points[1] = {
          ...performPoint,
          value: p0.value,  // Lock to entry price
        };
      }

      // Step 3: Drawing SL (Point 2) - project vertically
      if (currentStep === 3 && points.length >= 3) {
        points[2] = {
          ...performPoint,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }

      // Step 4: Drawing Target (Point 3) - project vertically
      if (currentStep === 4 && points.length >= 4) {
        points[3] = {
          ...performPoint,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }
    },

    performEventPressedDrawing: ({ points }: any) => {
      if (points && points.length > 0) {
        const p0 = points[0];
        const index = p0.dataIndex;
        const price = p0.value;
        // Default: 0.25% risk/reward, 15 bars width
        const offsetPrice = price * 0.0025;
        const offsetIndex = 15;

        // Ensure we have exactly 4 points established
        // P1: Entry Right (width)
        const p1 = { ...p0, dataIndex: index + offsetIndex, value: price };
        // P2: SL (Below for Long)
        const p2 = { ...p0, dataIndex: index, value: price - offsetPrice };
        // P3: Target (Above for Long)
        const p3 = { ...p0, dataIndex: index, value: price + offsetPrice };

        points[1] = p1;
        points[2] = p2;
        points[3] = p3;
      }
      return true;
    },
  });

  // ------------------------------------------------------
  // 7) SHORT POSITION (4-point system with projection)
  // Point 0: Entry Left, Point 1: Entry Right (width), Point 2: SL, Point 3: Target
  // All points are projected to their correct positions (not raw mouse)
  // ------------------------------------------------------
  registerOverlay({
    name: 'shortPosition',
    totalStep: 5,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: { style: 'solid', size: 1, color: '#ef5350' },
      text: { family: 'Arial, sans-serif', size: 11, color: '#ffffff' },
      point: { radius: 5 },
    },

    createPointFigures: ({ coordinates, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      if (!overlay || !overlay.points || overlay.points.length < 2) return [];

      // PROJECT all points to their correct positions
      const p0 = overlay.points[0];

      // Point 1: Project horizontally (same Y/value as p0, different X/dataIndex)
      if (overlay.points.length >= 2) {
        const rawP1 = overlay.points[1];
        coordinates[1] = {
          ...coordinates[1],
          y: coordinates[0].y,  // Lock to entry Y
        };
        overlay.points[1] = {
          ...rawP1,
          value: p0.value,  // Lock to entry price
        };
      }

      // Point 2 (SL): Project vertically (same X/dataIndex as p0, different Y/value)
      if (overlay.points.length >= 3) {
        const rawP2 = overlay.points[2];
        coordinates[2] = {
          ...coordinates[2],
          x: coordinates[0].x,  // Lock to entry X
        };
        overlay.points[2] = {
          ...rawP2,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }

      // Point 3 (Target): Project vertically (same X/dataIndex as p0, different Y/value)
      if (overlay.points.length >= 4) {
        const rawP3 = overlay.points[3];
        coordinates[3] = {
          ...coordinates[3],
          x: coordinates[0].x,  // Lock to entry X
        };
        overlay.points[3] = {
          ...rawP3,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }

      const figures: any[] = [];
      const entryLeft = coordinates[0];
      const entryRight = coordinates[1];
      const entryLeftPoint = overlay.points[0];

      const leftX = entryLeft.x;
      const rightX = entryRight.x;
      const boxWidth = rightX - leftX;
      const entryY = entryLeft.y;

      // Entry triangle marker at left point (pointing down for short)
      figures.push({
        key: 'short-entry-triangle',
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: entryLeft.x - 6, y: entryY - 10 },
            { x: entryLeft.x + 6, y: entryY - 10 },
            { x: entryLeft.x, y: entryY }
          ]
        },
        styles: { style: 'fill', color: '#ef5350' },
      });

      // Entry line (horizontal line connecting left and right points)
      figures.push({
        key: 'short-entry-line',
        type: 'line',
        attrs: { coordinates: [{ x: leftX, y: entryY }, { x: rightX, y: entryY }] },
        styles: { style: 'solid', size: 2, color: '#ef5350' },
      });

      // Stop Loss (point 2)
      if (coordinates.length >= 3 && overlay.points.length >= 3) {
        const sl = coordinates[2];
        const slPoint = overlay.points[2];

        figures.push({
          key: 'short-sl-background',
          type: 'rect',
          attrs: { x: leftX, y: Math.min(entryY, sl.y), width: boxWidth, height: Math.abs(sl.y - entryY) },
          styles: { style: 'fill', color: 'rgba(239,83,80,0.12)' },
        });
        figures.push({
          key: 'short-sl-line',
          type: 'line',
          attrs: { coordinates: [{ x: leftX, y: sl.y }, { x: rightX, y: sl.y }] },
          styles: { style: 'dashed', size: 1, color: '#ef5350' },
        });

        const slPrice = slPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'short-sl-label',
          type: 'text',
          attrs: { x: leftX + 5, y: sl.y + 3, text: `SL ${slPrice}`, align: 'left', baseline: 'top' },
          styles: { color: '#ffffff', size: 11, family: 'Arial, sans-serif' },
        });
      }

      // Target (point 3)
      if (coordinates.length >= 4 && overlay.points.length >= 4) {
        const target = coordinates[3];
        const targetPoint = overlay.points[3];

        figures.push({
          key: 'short-target-background',
          type: 'rect',
          attrs: { x: leftX, y: Math.min(entryY, target.y), width: boxWidth, height: Math.abs(target.y - entryY) },
          styles: { style: 'fill', color: 'rgba(38,166,154,0.12)' },
        });
        figures.push({
          key: 'short-target-line',
          type: 'line',
          attrs: { coordinates: [{ x: leftX, y: target.y }, { x: rightX, y: target.y }] },
          styles: { style: 'dashed', size: 1, color: '#26a69a' },
        });

        const targetPrice = targetPoint.value?.toFixed(precision?.price || 2) || '0.00';
        figures.push({
          key: 'short-target-label',
          type: 'text',
          attrs: { x: leftX + 5, y: target.y - 3, text: `TARGET ${targetPrice}`, align: 'left', baseline: 'bottom' },
          styles: { color: '#ffffff', size: 11, family: 'Arial, sans-serif' },
        });

        // Calculate and display Risk-Reward Ratio
        const slPoint = overlay.points[2];
        const entryValue = entryLeftPoint.value || 0;
        const slValue = slPoint.value || 0;
        const targetValue = targetPoint.value || 0;

        const risk = Math.abs(entryValue - slValue);
        const reward = Math.abs(entryValue - targetValue);
        const rrRatio = risk > 0 ? (reward / risk).toFixed(2) : '0.00';

        const rrBoxX = entryLeft.x + 10;
        const rrBoxY = entryY + 25;
        const rrText = `R:R 1:${rrRatio}`;

        figures.push({
          key: 'short-rr-box',
          type: 'rect',
          attrs: { x: rrBoxX, y: rrBoxY - 8, width: 85, height: 20 },
          styles: { style: 'fill', color: '#2962ff' },
        });

        figures.push({
          key: 'short-rr-text',
          type: 'text',
          attrs: { x: rrBoxX + 42.5, y: rrBoxY + 2, text: rrText, align: 'center', baseline: 'middle' },
          styles: { color: '#ffffff', size: 12, family: 'Arial, sans-serif', weight: 'bold' },
        });
      }

      return figures;
    },

    onPointMove: ({ overlay, pointIndex, performPoint }: any) => {
      if (!overlay || !overlay.points || !performPoint) return true;

      const entryLeft = overlay.points[0];
      const entryRight = overlay.points[1];

      // Point 0 (entry-left): Only horizontal movement, lock to entry Y/value
      if (pointIndex === 0 && overlay.points.length >= 2) {
        overlay.points[0] = {
          ...overlay.points[0],
          x: performPoint.x,
          y: entryRight.y,  // Lock to entry Y
          dataIndex: performPoint.dataIndex,
          value: entryRight.value,  // Lock to entry price
        };
      }

      // Point 1 (entry-right): Only horizontal movement, lock to entry Y/value
      if (pointIndex === 1 && overlay.points.length >= 2) {
        overlay.points[1] = {
          ...overlay.points[1],
          x: performPoint.x,
          y: entryLeft.y,  // Lock to entry Y
          dataIndex: performPoint.dataIndex,
          value: entryLeft.value,  // Lock to entry price
        };
      }

      // Point 2 (SL): only vertical movement, lock to entry X
      if (pointIndex === 2 && overlay.points.length >= 3) {
        overlay.points[2] = {
          ...overlay.points[2],
          x: entryLeft.x,
          y: performPoint.y,
          dataIndex: entryLeft.dataIndex,
          value: performPoint.value,
        };
      }

      // Point 3 (Target): only vertical movement, lock to entry X
      if (pointIndex === 3 && overlay.points.length >= 4) {
        overlay.points[3] = {
          ...overlay.points[3],
          x: entryLeft.x,
          y: performPoint.y,
          dataIndex: entryLeft.dataIndex,
          value: performPoint.value,
        };
      }

      return true;
    },

    performEventMoveForDrawing: ({ currentStep, points, performPoint }: any) => {
      if (!performPoint || !points || points.length === 0) return;

      const p0 = points[0];

      // Step 2: Drawing width (Point 1) - project horizontally
      if (currentStep === 2 && points.length >= 2) {
        points[1] = {
          ...performPoint,
          value: p0.value,  // Lock to entry price
        };
      }

      // Step 3: Drawing SL (Point 2) - project vertically
      if (currentStep === 3 && points.length >= 3) {
        points[2] = {
          ...performPoint,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }

      // Step 4: Drawing Target (Point 3) - project vertically
      if (currentStep === 4 && points.length >= 4) {
        points[3] = {
          ...performPoint,
          dataIndex: p0.dataIndex,  // Lock to entry dataIndex
        };
      }
    },

    performEventPressedDrawing: ({ points }: any) => {
      if (points && points.length > 0) {
        const p0 = points[0];
        const index = p0.dataIndex;
        const price = p0.value;
        // Default: 0.25% risk/reward, 15 bars width
        const offsetPrice = price * 0.0025;
        const offsetIndex = 15;

        // Ensure we have exactly 4 points established
        // P1: Entry Right (width)
        const p1 = { ...p0, dataIndex: index + offsetIndex, value: price };
        // P2: SL (Above for Short)
        const p2 = { ...p0, dataIndex: index, value: price + offsetPrice };
        // P3: Target (Below for Short)
        const p3 = { ...p0, dataIndex: index, value: price - offsetPrice };

        points[1] = p1;
        points[2] = p2;
        points[3] = p3;
      }
      return true;
    },
  });



  // ------------------------------------------------------
  // 9) DATE RANGE
  // ------------------------------------------------------
  registerOverlay({
    name: 'dateRange',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      line: { style: 'solid', size: 1, color: '#9c27b0' },
      polygon: { style: 'fill', color: 'rgba(156,39,176,0.1)' },
    },
    createPointFigures: ({ coordinates, bounding, overlay }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      if (!overlay || !overlay.points || overlay.points.length < 2) return [];
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const leftX = Math.min(p1.x, p2.x);
      const rightX = Math.max(p1.x, p2.x);
      const chartTop = bounding?.top || 0;
      const chartBottom = bounding?.height ? chartTop + bounding.height : 500;
      const figures: any[] = [];
      figures.push({
        key: 'dateRange-fill',
        type: 'rect',
        attrs: { x: leftX, y: chartTop, width: rightX - leftX, height: chartBottom - chartTop },
        styles: { style: 'fill', color: 'rgba(156,39,176,0.08)' },
      });
      figures.push({
        key: 'dateRange-left',
        type: 'line',
        attrs: { coordinates: [{ x: leftX, y: chartTop }, { x: leftX, y: chartBottom }] },
        styles: { style: 'solid', size: 1, color: '#9c27b0' },
      });
      figures.push({
        key: 'dateRange-right',
        type: 'line',
        attrs: { coordinates: [{ x: rightX, y: chartTop }, { x: rightX, y: chartBottom }] },
        styles: { style: 'solid', size: 1, color: '#9c27b0' },
      });
      const point1 = overlay.points[0];
      const point2 = overlay.points[1];
      const barDiff = Math.abs((point2?.dataIndex || 0) - (point1?.dataIndex || 0));
      figures.push({
        key: 'dateRange-label',
        type: 'text',
        attrs: { x: leftX + (rightX - leftX) / 2, y: chartTop + 20, text: `${barDiff} bars`, align: 'center', baseline: 'top' },
        styles: { color: '#9c27b0', size: 12, family: 'Arial, sans-serif', weight: 'bold' },
      });
      return figures;
    },
  });

  // ------------------------------------------------------
  // 10) CUSTOM TEXT
  // ------------------------------------------------------
  registerOverlay({
    name: 'customText',
    totalStep: 2, // 1 click to place, then auto-complete
    needDefaultPointFigure: false, // No blue control point background
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      text: { color: '#ffffff', size: 14, family: 'Arial', weight: 'bold' }
    },
    createPointFigures: ({ coordinates, overlay }: any) => {
      if (!coordinates || coordinates.length < 1) return [];
      // Use extendData for text content, default to "Text"
      const textContent = overlay.extendData || "Double click to edit";

      return [
        {
          key: 'custom-text-content',
          type: 'text',
          attrs: {
            x: coordinates[0].x,
            y: coordinates[0].y,
            text: textContent,
            align: 'left',
            baseline: 'bottom'
          },
          styles: {
            color: '#ffffff',
            size: 16,
            family: 'Arial',
            weight: 'bold',
            backgroundColor: 'transparent', // Explicitly transparent background
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderRadius: 0
          },
          ignoreEvent: false // Allow selecting the text
        }
      ];
    },
    performEventPressedDrawing: ({ points, performPoint }: any) => {
      // Only allow one point - stop after first click
      if (points && points.length === 0 && performPoint) {
        points.push({ ...performPoint });
      }
      return true;
    },
    onDrawEnd: async ({ overlay }: any) => {
      // Prompt for text immediately upon placement using custom modal
      const promptFunc = (window as any).customPrompt || window.prompt;
      const initialText = await promptFunc("Enter text:", "Text");

      if (initialText !== null && overlay) {
        overlay.extendData = initialText;
      }
      return true;
    },
    onDoubleClick: async ({ overlay, chart }: any) => {
      // Allow editing on double click using custom modal
      const currentText = overlay.extendData || "Text";
      const promptFunc = (window as any).customPrompt || window.prompt;
      const newText = await promptFunc("Enter text:", currentText);

      if (newText !== null) {
        // Update overlay extendData
        overlay.extendData = newText;
        // Force redraw/update
        return {
          extendData: newText
        };
      }
      return true;
    }
  });

  // ------------------------------------------------------
  // 10) DATE + PRICE RANGE (Combined)
  // ------------------------------------------------------
  registerOverlay({
    name: 'datePriceRange',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
      rect: { style: 'stroke_fill', color: 'rgba(255,152,0,0.08)', borderColor: '#ff9800', borderSize: 1 },
    },
    createPointFigures: ({ coordinates, overlay, precision }: any) => {
      if (!coordinates || coordinates.length < 2) return [];
      if (!overlay || !overlay.points || overlay.points.length < 2) return [];
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const leftX = Math.min(p1.x, p2.x);
      const rightX = Math.max(p1.x, p2.x);
      const topY = Math.min(p1.y, p2.y);
      const bottomY = Math.max(p1.y, p2.y);
      const point1 = overlay.points[0];
      const point2 = overlay.points[1];

      // Calculate price difference and percentage (preserving sign for direction)
      const priceDiff = point2.value - point1.value;
      const percentage = ((priceDiff / point1.value) * 100).toFixed(2);
      const priceChange = priceDiff.toFixed(precision?.price || 2);

      // Determine color based on direction
      const isPositive = priceDiff >= 0;
      const color = isPositive ? '#ffffff' : '#ef5350';  // White for positive, red for negative
      const sign = isPositive ? '+' : '';

      const figures: any[] = [];
      figures.push({
        key: 'datePriceRange-box',
        type: 'rect',
        attrs: { x: leftX, y: topY, width: rightX - leftX, height: bottomY - topY },
        styles: { style: 'stroke_fill', color: 'rgba(255,152,0,0.08)', borderColor: '#ff9800', borderSize: 1.5 },
      });

      figures.push({
        key: 'datePriceRange-price-label',
        type: 'text',
        attrs: { x: leftX + 5, y: topY + 5, text: `${sign}${priceChange} (${sign}${percentage}%)`, align: 'left', baseline: 'top' },
        styles: { color: color, size: 11, family: 'Arial, sans-serif', weight: 'bold' },
      });

      const barDiff = Math.abs((point2?.dataIndex || 0) - (point1?.dataIndex || 0));
      figures.push({
        key: 'datePriceRange-time-label',
        type: 'text',
        attrs: { x: rightX - 5, y: bottomY - 5, text: `${barDiff} bars`, align: 'right', baseline: 'bottom' },
        styles: { color: '#ff9800', size: 11, family: 'Arial, sans-serif', weight: 'bold' },
      });
      return figures;
    },
  });

  // Done registering overlays
}
