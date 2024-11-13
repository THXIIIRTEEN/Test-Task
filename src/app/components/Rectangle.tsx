'use client'

import React, { ChangeEvent } from 'react';
import Styles from './rectangle.module.css';
import { RectangleType } from '../types/types';

type RectangleProps = {
  setRectangleValues: React.Dispatch<React.SetStateAction<RectangleType>>;
  rectangleValues: RectangleType;
};

const Rectangle: React.FC<RectangleProps> = ({ rectangleValues, setRectangleValues }) => {

  const calculateCentralCoordinates = (rectangle: RectangleType) => {
    const { position, size } = rectangle;
    return {
      x: position.x + size.width / 2,  
      y: position.y + size.height / 2, 
    };
  };

  const centralCoordinates = calculateCentralCoordinates(rectangleValues);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numericValue = Number(value);

    if (name === 'width' || name === 'height') {
      setRectangleValues((prevValues) => ({
        ...prevValues,
        size: {
          ...prevValues.size,
          [name]: numericValue || 0,
        },
      }));
    } else if (name === 'central-x' || name === 'central-y') {
      setRectangleValues((prevValues) => {
        const newPosition = {
          x: name === 'central-x' ? numericValue - prevValues.size.width / 2 : prevValues.position.x,
          y: name === 'central-y' ? numericValue - prevValues.size.height / 2 : prevValues.position.y,
        };
        
        return {
          ...prevValues,
          position: newPosition,
        };
      });
    }
  };

  return (
    <>
      <form className={Styles['form']}>
        <label className='label' htmlFor="size">Размеры</label>
        <input
          id="width"
          type="number"
          name="width"
          value={rectangleValues.size.width || ''}
          onChange={handleInputChange}
          placeholder="Ширина прямоугольника"
        />
        <input
          className="bottomInput"
          id="height"
          type="number"
          name="height"
          value={rectangleValues.size.height || ''}
          onChange={handleInputChange}
          placeholder="Высота прямоугольника"
        />

        <label className='label' htmlFor="position">Позиция</label>
        <input
          id="central-x"
          type="number"
          name="central-x"
          value={centralCoordinates.x || ''}
          onChange={handleInputChange}
          placeholder="Центр по X"
        />
        <input
          id="central-y"
          type="number"
          name="central-y"
          value={centralCoordinates.y || ''}
          onChange={handleInputChange}
          placeholder="Центр по Y"
        />
      </form>
    </>
  );
}

export default Rectangle;
