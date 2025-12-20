import React from "react";
import LifeUpdateZero from "./LifeUpdateZero";

export type LifeUpdateEntry = {
  id: string;
  title: string;
  date: string;
  Component: React.ComponentType;
};

export const lifeUpdates: LifeUpdateEntry[] = [
  {
    id: "0",
    title: "Life Update #0",
    date: "2025-12-20",
    Component: LifeUpdateZero,
  },
];

export function getLifeUpdateById(id: string) {
  return lifeUpdates.find((u) => u.id === id);
}


