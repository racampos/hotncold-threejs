import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { boxes, planes } from './scene.js';
import { meshes } from './test.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const objRadius = 0.02;
const threejsToO1jsScale = 1000000;

const showSphereAtPoint = (point, color) => {
  const geometry = new THREE.SphereGeometry(objRadius, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const pointMesh = new THREE.Mesh(geometry, material);
  pointMesh.position.set(point.x, point.y, point.z);
  scene.add(pointMesh);
  }

const displayNormalVector = (normal, A, B, C) => {
  // Choose a length for the normal vector representation
  const normalLength = 1;
  // Calculate the center of the triangle (average of its vertices)
  const triangleCenter = new THREE.Vector3().addVectors(A, B).add(C).divideScalar(3);
  // Calculate the position of the end point of the line
  const endPoint = new THREE.Vector3().copy(triangleCenter).add(normal.clone().multiplyScalar(normalLength));
  // Create a line geometry
  const lineGeometry = new THREE.BufferGeometry();
  const lineVertices = new Float32Array([triangleCenter.x, triangleCenter.y, triangleCenter.z, endPoint.x, endPoint.y, endPoint.z]);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(lineVertices, 3));
  // Create a material for the line (e.g., a basic red material)
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  // Create a line mesh
  const line = new THREE.Line(lineGeometry, lineMaterial);
  // Add the line to your scene
  scene.add(line);
}

const getBoxPoints = (boxMesh, translationMatrix) => {
  const v = boxMesh.geometry.attributes.position.array;
  const vertices = [];
  for (let i = 0; i < v.length; i += 3) {
    const vertex = new THREE.Vector3(v[i], v[i + 1], v[i + 2]);
    // vertex.applyMatrix4(translationMatrix);
    vertices.push(vertex);
  }
  let closestVertex = null;
  let farthestVertex = null;
  let closestDistance = Infinity; // A very large number to start with
  let farthestDistance = 0; // Start with 0 for the farthest
  // Loop through all vertices to find the closest and farthest
  vertices.forEach(vertex => {
    let distance = vertex.length(); // Get the distance from origin
    // Check if this vertex is closer than the current closest
    if (distance < closestDistance) {
      closestDistance = distance;
      closestVertex = vertex;
    }
    // Check if this vertex is farther than the current farthest
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestVertex = vertex;
    }
  });
  return { closestVertex, farthestVertex };
}

camera.position.z = 2;

// Hidden object in real-world coordinates
// const rwHiddenObject = new THREE.Vector3(-0.1, 0.1, -0.1); // object on floor (valid)
// const rwHiddenObject = new THREE.Vector3(-0.8, 0.3, -0.2); // object inside room and outside any furniture (valid)
const rwHiddenObject = new THREE.Vector3(-0.5, 0.5, -5);
showSphereAtPoint(rwHiddenObject, 0x00ff00);
// 

// const boxes = [];

//   // Extract the required information
// Object.values(meshes).forEach(item => {
//   const geometry = item?.mesh?.geometries?.[0]?.data?.attributes?.position?.array;
//   const matrixData = item?.mesh?.object?.matrix;
//   const indices = item?.mesh?.geometries?.[0]?.data?.index?.array;
  
//   if (geometry && matrixData) {
//     boxes.push({
//       vertices: geometry,
//       indices: indices,
//       matrix: matrixData
//     });
//   }
// });

boxes.forEach((object) => {
  const verticesArray = new Float32Array(Object.values(object.vertices));
  const indicesArray = new Uint32Array(Object.values(object.indices));
  const boxGeometry = new THREE.BufferGeometry();
  boxGeometry.setAttribute( 'position', new THREE.BufferAttribute( verticesArray, 3 ) );
  boxGeometry.setIndex(new THREE.BufferAttribute( indicesArray, 1 ));
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  const matrix = new THREE.Matrix4();
  matrix.fromArray(object.matrix);
  // Compute inverse matrix
  const inverseMatrix = new THREE.Matrix4().copy(matrix).invert();
  const hiddenObject = rwHiddenObject.clone();
  // Move real-world hidden object to box coordinates
  hiddenObject.applyMatrix4(inverseMatrix);

  // Compute translation to origin vector
  const vertices = boxMesh.geometry.attributes.position.array;
  const translationToOrigin = new THREE.Vector3(vertices[0], vertices[1], vertices[2]);
  translationToOrigin.negate(); // Translation to origin is the negative of the first vertex
  const translationToOriginMatrix = new THREE.Matrix4().makeTranslation(translationToOrigin.x, translationToOrigin.y, translationToOrigin.z);
  // Translate hidden object to origin
  hiddenObject.applyMatrix4(translationToOriginMatrix);

  // Compute translation of hidden object to positive coordinates
  const translationToPositiveCoords = new THREE.Vector3();
  console.log('hiddenObject', hiddenObject);
  translationToPositiveCoords.x = hiddenObject.x - objRadius < 0 ? -hiddenObject.x + objRadius : 0;
  translationToPositiveCoords.y = hiddenObject.y - objRadius< 0 ? -hiddenObject.y + objRadius : 0;
  translationToPositiveCoords.z = hiddenObject.z - objRadius < 0 ? -hiddenObject.z + objRadius : 0;
  const translationToPositiveCoordsMatrix = new THREE.Matrix4().makeTranslation(translationToPositiveCoords.x, translationToPositiveCoords.y, translationToPositiveCoords.z);

  // Translate hidden object to positive coordinates
  hiddenObject.applyMatrix4(translationToPositiveCoordsMatrix);
  // showSphereAtPoint(hiddenObject, 0x00ff00);
  const hiddenObjectScaled = new THREE.Vector3(Math.round(hiddenObject.x * threejsToO1jsScale), Math.round(hiddenObject.y * threejsToO1jsScale), Math.round(hiddenObject.z * threejsToO1jsScale));

  // Move boxMesh
  // boxMesh.matrixAutoUpdate = false;
  // const translationMatrix = translationToOriginMatrix.clone().multiply(translationToPositiveCoordsMatrix);
  // boxMesh.matrix = translationMatrix;
  // scene.add(boxMesh);
  // const boxPoints = getBoxPoints(boxMesh, translationMatrix);
  // Object.keys(boxPoints).forEach((key) => {
  //   boxPoints[key] = new THREE.Vector3(Math.round(boxPoints[key].x * threejsToO1jsScale), Math.round(boxPoints[key].y * threejsToO1jsScale), Math.round(boxPoints[key].z * threejsToO1jsScale));
  //   });

});

boxes.forEach((box) => {
  const verticesArray = new Float32Array(Object.values(box.vertices));
  const indicesArray = new Uint32Array(Object.values(box.indices));
  const boxGeometry = new THREE.BufferGeometry();
  boxGeometry.setAttribute( 'position', new THREE.BufferAttribute( verticesArray, 3 ) );
  boxGeometry.setIndex(new THREE.BufferAttribute( indicesArray, 1 ));
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  const matrix = new THREE.Matrix4();
  matrix.fromArray(box.matrix);
  boxMesh.matrixAutoUpdate = false;
  boxMesh.matrix = matrix;
  scene.add(boxMesh);
});

planes.forEach((plane) => {

  const planeGeometry = new THREE.ShapeGeometry();
  planeGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( new Float32Array(Object.values(plane.position)), 3 ) );
  const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
  const planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
  planeMesh.matrixAutoUpdate = false;
  const localMatrix = new THREE.Matrix4();
  localMatrix.fromArray(plane.matrix);
  planeMesh.matrix = localMatrix;
  planeMesh.matrix.decompose(planeMesh.position, planeMesh.quaternion, planeMesh.scale);
  scene.add(planeMesh);

  const v = planeMesh.geometry.attributes.position.array;
  const vertices = [];
  for (let i = 0; i < v.length; i += 3) {
    vertices.push(v.slice(i, i + 3));
  }

  const vectorVertices =[];
  for (const vertex of vertices) {
    const point = new THREE.Vector3(...vertex);
    point.applyMatrix4(planeMesh.matrix);
    showSphereAtPoint(point, 0xff0000);
    vectorVertices.push(point);
  }
  // Compute the vectors AB and AC
  const A = vectorVertices[0];
  const B = vectorVertices[1];
  const C = vectorVertices[2];
  const AB = new THREE.Vector3().subVectors(B, A);
  const AC = new THREE.Vector3().subVectors(C, A);
  // Compute the cross product to find the normal vector
  const normal = new THREE.Vector3().crossVectors(AB, AC);
  // Normalize the normal vector
  normal.normalize().multiplyScalar(-1);
  displayNormalVector(normal, A, B, C);

  // Given triangle vertices A, B, C, normal vector Normal, and 3D point Point
 
  // Calculate vector from vertex A to the point
  const V = new THREE.Vector3().subVectors(rwHiddenObject, A);

  // Calculate the dot product between the normal and V
  const dotProduct = normal.dot(V);

  // Determine if the point is on the side of the triangle where the normal points
  if (dotProduct > 0) {
    console.log("The point is on the positive side of the triangle.");
  } else if (dotProduct < 0) {
    console.log("The point is on the negative side of the triangle.");
  } else {
    console.log("The point is exactly on the plane of the triangle.");
  }
  

  console.log("********");
  // const normal = planeMesh.geometry.attributes.normal.array;
  // console.log('normal', normal);
  // const normalVector = new THREE.Vector3(normal[0], normal[1], normal[2]);
  // showSphereAtPoint(point, 0x0000ff);
});


const controls = new OrbitControls(camera, renderer.domElement);
const axesHelper = new THREE.AxesHelper(5);  // Length of 5 units
scene.add(axesHelper);

function animate() {
	requestAnimationFrame( animate );
  controls.update();
	renderer.render( scene, camera );
}
animate();