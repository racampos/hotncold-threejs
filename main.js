import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { objects, planes } from './scene.js' 


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const showSphereAtPoint = (point, color) => {
  const geometry = new THREE.SphereGeometry(0.02, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const pointMesh = new THREE.Mesh(geometry, material);
  pointMesh.position.set(point.x, point.y, point.z);
  scene.add(pointMesh);
}

// // World Position Test
// const worldPos = new THREE.Vector3(0.007254546508193016, 1.1354987621307373, -0.34986943006515503);
// showSphereAtPoint(worldPos, 0x00ff00);

camera.position.z = 2;
// camera.position.x = 1;
// camera.position.y = 1;

// Hidden object
// const rwHiddenObject = new THREE.Vector3(0.9, 0.1, -0.5);
const rwHiddenObject = new THREE.Vector3(0.5, 0.5, -0.5);

showSphereAtPoint(rwHiddenObject, 0x00ff00);


objects.forEach((object) => {

  const verticesArray = new Float32Array(Object.values(object.vertices));
  const indicesArray = new Uint32Array(Object.values(object.indices));

  const tableGeometry = new THREE.BufferGeometry();
  tableGeometry.setAttribute( 'position', new THREE.BufferAttribute( verticesArray, 3 ) );
  tableGeometry.setIndex(new THREE.BufferAttribute( indicesArray, 1 ));
  const tableMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
  const rwTableMesh = tableMesh.clone();
  const localMatrix = new THREE.Matrix4();
  localMatrix.fromArray(object.matrix);
  rwTableMesh.matrixAutoUpdate = false;
  rwTableMesh.matrix = localMatrix;
  rwTableMesh.matrix.decompose(rwTableMesh.position, rwTableMesh.quaternion, rwTableMesh.scale);
  scene.add(rwTableMesh);
  console.log('rwTableMesh', rwTableMesh);

  const v = tableMesh.geometry.attributes.position.array;
  const vertices = [];
  for (let i = 0; i < v.length; i += 3) {
    vertices.push(v.slice(i, i + 3));
  }
  for (const vertex of vertices) {
    const point = new THREE.Vector3(...vertex);
    point.applyMatrix4(rwTableMesh.matrix);
    showSphereAtPoint(point, 0xff0000);
  }

  const vectorVertices = vertices.map((vertex) => new THREE.Vector3(...vertex));
  const vertexToOrigin = vectorVertices[0];
  const translation = vertexToOrigin.clone().negate(); // Translation to origin
  for (const vertex of vectorVertices) {
      vertex.add(translation);
      vertex.applyMatrix4(tableMesh.matrix);
      showSphereAtPoint(vertex, 0xff0000);
      console.log(vertex);
  };

  const translationMatrix = new THREE.Matrix4().makeTranslation(translation.x, translation.y, translation.z);
  const inverseMatrix = new THREE.Matrix4().copy(localMatrix).invert();
  // const updatedMatrix = inverseMatrix.clone().multiply(translationMatrix);
  const updatedMatrix = translationMatrix.multiply(inverseMatrix);
  const hiddenObject = rwHiddenObject.clone();
  hiddenObject.applyMatrix4(updatedMatrix);
  showSphereAtPoint(hiddenObject, 0x00ff00);


});

planes.forEach((plane) => {

  const planeGeometry = new THREE.ShapeGeometry();
  planeGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( new Float32Array(Object.values(plane.position)), 3 ) );
  planeGeometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( new Float32Array(Object.values(plane.normal)), 3 ) );
  planeGeometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( new Float32Array(Object.values(plane.uv)), 2 ) );
  const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  const planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
  planeMesh.matrixAutoUpdate = false;
  const localMatrix = new THREE.Matrix4();
  localMatrix.fromArray(plane.matrix);
  planeMesh.matrix = localMatrix;
  planeMesh.matrix.decompose(planeMesh.position, planeMesh.quaternion, planeMesh.scale);
  scene.add(planeMesh);
  console.log('planeMesh', planeMesh);

  const v = planeMesh.geometry.attributes.position.array;
  const vertices = [];
  for (let i = 0; i < v.length; i += 3) {
    vertices.push(v.slice(i, i + 3));
  }
  for (const vertex of vertices) {
    const point = new THREE.Vector3(...vertex);
    point.applyMatrix4(planeMesh.matrix);
    showSphereAtPoint(point, 0xff0000);
  }
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