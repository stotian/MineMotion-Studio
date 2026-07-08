import * as THREE from "three";

export function createGridFloor(): THREE.Group {
  const group = new THREE.Group();
  group.name = "Grid Floor";

  const grid = new THREE.GridHelper(64, 64, "#3f4655", "#252b36");
  grid.position.y = 0.01;
  group.add(grid);

  const axes = new THREE.AxesHelper(4);
  axes.position.y = 0.02;
  group.add(axes);

  return group;
}

