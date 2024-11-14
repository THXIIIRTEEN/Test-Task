'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import Rectangle from "./components/Rectangle";
import Styles from './page.module.css'
import { RectangleType, Point } from "./types/types";

export default function Home() {
  const [firstRectangle, setFirstRectangle] = useState<RectangleType>({
    position: { x: 600, y: 200 },
    size: { width: 40, height: 40 },
  });

  const [secondRectangle, setSecondRectangle] = useState<RectangleType>({
    position: { x: 800, y: 200 },
    size: { width: 80, height: 80 },
  });

  const [dragRectangle, setDragRectangle] = useState<string | null>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const adjustCanvasSize = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const scale = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
      }
    }
  };

  const calculateLineLength = useCallback((point1: { x: number, y: number }, point2: { x: number, y: number }): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const calculateCentralPoints = useCallback((rectangle: RectangleType) => {
    const { position, size } = rectangle;
    const { x, y } = position;
    const { width, height } = size;
  
    const topCenter: Point = { x, y: y - height / 2 };
    const bottomCenter: Point = { x, y: y + height / 2 };
    const leftCenter: Point = { x: x - width / 2, y };
    const rightCenter: Point = { x: x + width / 2, y };
  
    return {
      topCenter: { point: topCenter, name: 'topCenter' },
      bottomCenter: { point: bottomCenter, name: 'bottomCenter' },
      leftCenter: { point: leftCenter, name: 'leftCenter' },
      rightCenter: { point: rightCenter, name: 'rightCenter' }
    };
  }, []);

  const calculatePossibleConnections = useCallback((rect1: RectangleType, rect2: RectangleType) => {
    const centers1 = calculateCentralPoints(rect1);
    const centers2 = calculateCentralPoints(rect2);
  
    let shortestDistance = Infinity;
    let closestPoints: [Point, Point] = [centers1.topCenter.point, centers2.topCenter.point];
    let closestPointNames: [string, string] = [centers1.topCenter.name, centers2.topCenter.name];
  
    const points1 = [centers1.topCenter, centers1.bottomCenter, centers1.leftCenter, centers1.rightCenter];
    const points2 = [centers2.topCenter, centers2.bottomCenter, centers2.leftCenter, centers2.rightCenter];
  
    for (const point1 of points1) {
      for (const point2 of points2) {
        const distance = calculateLineLength(point1.point, point2.point);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestPoints = [point1.point, point2.point];
          closestPointNames = [point1.name, point2.name];
        }
      }
    }
  
    return { distance: shortestDistance, points: closestPoints, pointNames: closestPointNames };
  }, [calculateCentralPoints, calculateLineLength]);  

  const calculatePath = useCallback(() => {
    const points = calculatePossibleConnections(firstRectangle, secondRectangle);
    const path = [
      {x: points.points[0].x, y: points.points[0].y},
      {x: points.points[1].x, y: points.points[1].y}
    ]

    points.points.forEach((point, index) => {
      let newPoint: { x: number; y: number } = { x: 0, y: 0 };
      if (points.pointNames[index] === 'topCenter') {
        newPoint = {
          x: points.points[index].x,
          y: points.points[index].y - 5,
        }
      }
      if (points.pointNames[index] === 'bottomCenter') {
        newPoint = {
          x: points.points[index].x,
          y: points.points[index].y + 5,
        }
      }
      if (points.pointNames[index] === 'leftCenter') {
        newPoint = {
          x: points.points[index].x - 5,
          y: points.points[index].y,
        }
      }
      if (points.pointNames[index] === 'rightCenter') {
        newPoint = {
          x: points.points[index].x + 5,
          y: points.points[index].y,
        }
      }
      if (index === 0) {
        path.splice(1, 0, newPoint);
      }
      if (index === 1) {
        path.splice(2, 0, newPoint);
      }
    })
    return path
  }, [firstRectangle, secondRectangle, calculatePossibleConnections]);

  const calculateMiddlePoint = useCallback(() => {
    const path = calculatePath();
    let middlePoint = {x: path[1].x, y: path[2].y}
    let startPoint = null;
    if (
      middlePoint.x >= secondRectangle.position.x - secondRectangle.size.width / 2 &&
      middlePoint.x <= secondRectangle.position.x + secondRectangle.size.width / 2 &&
      middlePoint.y >= secondRectangle.position.y - secondRectangle.size.height / 2 &&
      middlePoint.y <= secondRectangle.position.y + secondRectangle.size.height / 2
    ) {
      middlePoint = {x: path[2].x, y: path[1].y}
    }
    if (
      middlePoint.x >= firstRectangle.position.x - firstRectangle.size.width / 2 &&
      middlePoint.x <= firstRectangle.position.x + firstRectangle.size.width / 2 &&
      middlePoint.y >= firstRectangle.position.y - firstRectangle.size.height / 2 &&
      middlePoint.y <= firstRectangle.position.y + firstRectangle.size.height / 2
    ) {
      const index = path.length - 1;
      middlePoint = {x: firstRectangle.position.x, y: secondRectangle.position.y};
      
      const bottomPoint = {x: firstRectangle.position.x, y: firstRectangle.position.y - firstRectangle.size.height / 2};
      const topPoint = {x: firstRectangle.position.x, y: firstRectangle.position.y + firstRectangle.size.height / 2};
      
      const firstPath = calculateLineLength(bottomPoint, path[index]);
      const secondPath = calculateLineLength(topPoint, path[index]);

      if (firstPath < secondPath) {
        startPoint = bottomPoint;
      }
      else if (firstPath > secondPath) {
        startPoint = topPoint;
      }
    }
    if (!startPoint) {
      path.splice(2, 0, middlePoint);
    }
    if (startPoint) {
      path.splice(0, 1, startPoint);
      path.splice(2, 0, middlePoint);
      path.splice(1, 1);
    }
    return path
  }, [calculatePath, secondRectangle, firstRectangle, calculateLineLength])

  const drawRectangle = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Устанавливаем цвет и толщину линий сетки
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;

        // Интервал между линиями сетки
        const gridInterval = 20;

        // Рисуем горизонтальные линии
        for (let y = 0; y <= canvas.height; y += gridInterval) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Рисуем вертикальные линии
        for (let x = 0; x <= canvas.width; x += gridInterval) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        ctx.fillStyle = '#409EF7';
        ctx.strokeStyle = '#125CA2';
        ctx.lineWidth = 1;
        ctx.fillRect(
          firstRectangle.position.x - firstRectangle.size.width / 2,
          firstRectangle.position.y - firstRectangle.size.height / 2,
          firstRectangle.size.width,
          firstRectangle.size.height
        );
        ctx.strokeRect(
          firstRectangle.position.x - firstRectangle.size.width / 2,
          firstRectangle.position.y - firstRectangle.size.height / 2,
          firstRectangle.size.width,
          firstRectangle.size.height
        );

        ctx.fillStyle = '#409EF7';
        ctx.strokeStyle = '#125CA2';
        ctx.lineWidth = 1;
        ctx.fillRect(
          secondRectangle.position.x - secondRectangle.size.width / 2,
          secondRectangle.position.y - secondRectangle.size.height / 2,
          secondRectangle.size.width,
          secondRectangle.size.height
        );
        ctx.strokeRect(
          secondRectangle.position.x - secondRectangle.size.width / 2,
          secondRectangle.position.y - secondRectangle.size.height / 2,
          secondRectangle.size.width,
          secondRectangle.size.height
        );

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        const path = calculateMiddlePoint();
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    }
  }, [firstRectangle, secondRectangle, calculateMiddlePoint]);

  useEffect(() => {
    adjustCanvasSize();
    drawRectangle();
  }, [drawRectangle]);

  const getCursorPosition = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    return { x, y };
  };

  const checkRectanglesOverlap = (rect1: RectangleType, rect2: RectangleType) => {
    const left1 = rect1.position.x - rect1.size.width / 2;
    const right1 = rect1.position.x + rect1.size.width / 2;
    const top1 = rect1.position.y - rect1.size.height / 2;
    const bottom1 = rect1.position.y + rect1.size.height / 2;

    const left2 = rect2.position.x - rect2.size.width / 2;
    const right2 = rect2.position.x + rect2.size.width / 2;
    const top2 = rect2.position.y - rect2.size.height / 2;
    const bottom2 = rect2.position.y + rect2.size.height / 2;

    return !(right1 <= left2 || right2 <= left1 || bottom1 <= top2 || bottom2 <= top1);
  };

  const checkRectanglesClose = (rect1: RectangleType, rect2: RectangleType) => {
    const minDistance = 10; 
    const left1 = rect1.position.x - rect1.size.width / 2;
    const right1 = rect1.position.x + rect1.size.width / 2;
    const top1 = rect1.position.y - rect1.size.height / 2;
    const bottom1 = rect1.position.y + rect1.size.height / 2;

    const left2 = rect2.position.x - rect2.size.width / 2;
    const right2 = rect2.position.x + rect2.size.width / 2;
    const top2 = rect2.position.y - rect2.size.height / 2;
    const bottom2 = rect2.position.y + rect2.size.height / 2;

    return (
      Math.abs(right1 - left2) < minDistance ||
      Math.abs(right2 - left1) < minDistance ||
      Math.abs(bottom1 - top2) < minDistance ||
      Math.abs(bottom2 - top1) < minDistance
    );
  };

  const onMouseDown = (event: React.MouseEvent) => {
    const cursorPos = getCursorPosition(event);
    if (cursorPos) {
      checkRectangleClick(cursorPos.x, cursorPos.y);
    }
  };

  const checkRectangleClick = (x: number, y: number) => {
    if (
      x >= firstRectangle.position.x - firstRectangle.size.width / 2 &&
      x <= firstRectangle.position.x + firstRectangle.size.width / 2 &&
      y >= firstRectangle.position.y - firstRectangle.size.height / 2 &&
      y <= firstRectangle.position.y + firstRectangle.size.height / 2
    ) {
      setDragRectangle('first-rectangle');
      setIsGrabbing(true);
    } else if (
      x >= secondRectangle.position.x - secondRectangle.size.width / 2 &&
      x <= secondRectangle.position.x + secondRectangle.size.width / 2 &&
      y >= secondRectangle.position.y - secondRectangle.size.height / 2 &&
      y <= secondRectangle.position.y + secondRectangle.size.height / 2
    ) {
      setDragRectangle('second-rectangle');
      setIsGrabbing(true);
    } else {
      setDragRectangle(null);
      setIsGrabbing(false);
    }
  };

  const checkRectangleHover = (x: number, y: number) => {
    const isHoveringFirst =
      x >= firstRectangle.position.x - firstRectangle.size.width / 2 &&
      x <= firstRectangle.position.x + firstRectangle.size.width / 2 &&
      y >= firstRectangle.position.y - firstRectangle.size.height / 2 &&
      y <= firstRectangle.position.y + firstRectangle.size.height / 2;

    const isHoveringSecond =
      x >= secondRectangle.position.x - secondRectangle.size.width / 2 &&
      x <= secondRectangle.position.x + secondRectangle.size.width / 2 &&
      y >= secondRectangle.position.y - secondRectangle.size.height / 2 &&
      y <= secondRectangle.position.y + secondRectangle.size.height / 2;

    setIsHovering(isHoveringFirst || isHoveringSecond);
  };

  const onMouseMove = (event: React.MouseEvent) => {
    const cursorPos = getCursorPosition(event);
    if (cursorPos) {
      checkRectangleHover(cursorPos.x, cursorPos.y);
      if (dragRectangle) {
        const newFirstRectangle = dragRectangle === 'first-rectangle' ? {
          ...firstRectangle,
          position: {
            x: cursorPos.x,
            y: cursorPos.y
          }
        } : firstRectangle;

        const newSecondRectangle = dragRectangle === 'second-rectangle' ? {
          ...secondRectangle,
          position: {
            x: cursorPos.x,
            y: cursorPos.y
          }
        } : secondRectangle;

        if (checkRectanglesOverlap(newFirstRectangle, newSecondRectangle) || checkRectanglesClose(newFirstRectangle, newSecondRectangle)) {
        } else {
          if (dragRectangle === 'first-rectangle') {
            setFirstRectangle(newFirstRectangle);
          } else if (dragRectangle === 'second-rectangle') {
            setSecondRectangle(newSecondRectangle);
          }
        }
      }
    }
  };

  const onMouseUp = () => {
    setDragRectangle(null);
    setIsGrabbing(false);
  };

  return (
    <>
      <div className={Styles['form-block']}>
        <div className={Styles['rectangle-block']}>
          <h2 className="heading">Первый прямоугольник</h2>
          <Rectangle rectangleValues={firstRectangle} setRectangleValues={setFirstRectangle} />
        </div>

        <div className={Styles['rectangle-block']}>
          <h2 className="heading">Второй прямоугольник</h2>
          <Rectangle rectangleValues={secondRectangle} setRectangleValues={setSecondRectangle} />
        </div>
      </div>
      <canvas
        className={`${Styles.canvas} ${isGrabbing ? Styles.grabbing : isHovering ? Styles.grab : ''}`}
        width={800}
        height={600}
        ref={canvasRef}
        onDragStart={() => false}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      ></canvas>
    </>
  );
}
