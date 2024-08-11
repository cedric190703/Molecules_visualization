'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

interface Props {
    content: string;
}

// Define available molecules and the default selection
const MOLECULES = {
    'caffeine': 'caffeine.pdb',
    'ethanol': 'ethanol.pdb',
    'glucose': 'glucose.pdb',
    'cocaine': 'cocaine.pdb',
    'cholesterol': 'cholesterol.pdb'
};

// Define available styles
const STYLES = ['Spheres', 'Wireframe', 'Points', 'Depth', 'Normal', 'Physical'];

// Default molecule and visualization style
const params = {
    molecule: 'caffeine.pdb',
    style: 'Spheres',
};

// Initialize the PDBLoader instance for loading molecular data
const loader = new PDBLoader();

// Vector3 for positioning molecules correctly
const offset = new THREE.Vector3();

const MoleculeVisualization : React.FC<Props> = ({ content }) => {
    const [molecule, setMolecule] = useState(params.molecule);
    const [style, setStyle] = useState(params.style);

    useEffect(() => {
        // Set up the CSS2DRenderer for rendering HTML labels in 3D
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(labelRenderer.domElement);

        // Create and configure the GUI for selecting different molecules and styles
        const gui = new GUI();
        gui.add(params, 'molecule', MOLECULES).onChange((value) => {
            setMolecule(value); // Update state when molecule selection changes
        });
        gui.add(params, 'style', STYLES).onChange((value) => {
            setStyle(value); // Update state when style selection changes
        });

        gui.open(); // Open the GUI

        // Clean up GUI on component unmount
        return () => {
            // Remove the GUI window
            gui.destroy();

        };
    }, []);

    return (
        <Canvas className="w-full">
            {/* Lighting setup */}
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            {/* Molecule component with current model and style */}
            <Molecule model={molecule} style={style} content={content} />
            {/* OrbitControls to allow user interaction */}
            <OrbitControls />
        </Canvas>
    );
};

const Molecule = ({ model, style, content }) => {
    const { scene, camera, gl } = useThree();
    const root = useRef(); // Ref to the group that contains 3D objects

    useEffect(() => {
        // Set the initial position and orientation of the camera
        camera.position.set(700, 200, 0); // Position the camera
        camera.lookAt(0, 0, 0); // Point the camera at the origin

        const loadMolecule = (model, style) => {
            const url = content ? `data:text/plain;base64,${btoa(content)}` : 'PDB/' + model;

            // Clear previous objects from the group
            while (root.current.children.length > 0) {
                const object = root.current.children[0];
                object.parent.remove(object);
            }

            // Load the molecule data
            loader.load(url, function (pdb) {
                // Contains the geometry data for the atoms
                const geometryAtoms = pdb.geometryAtoms;

                // Contains the  geometry data for the bonds
                const geometryBonds = pdb.geometryBonds;

                // Contains additional metadata about the molecule
                const json = pdb.json;

                // Used to create the geometry for the bonds
                const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

                // Used to create the geometry for the molecule
                const sphereGeometry = new THREE.IcosahedronGeometry(1, 3);

                geometryAtoms.computeBoundingBox();
                geometryAtoms.boundingBox.getCenter(offset).negate();

                geometryAtoms.translate(offset.x, offset.y, offset.z);
                geometryBonds.translate(offset.x, offset.y, offset.z);

                let positions = geometryAtoms.getAttribute('position');
                const colors = geometryAtoms.getAttribute('color');

                const position = new THREE.Vector3();
                const color = new THREE.Color();

                // Creating 3D Atoms object
                for (let i = 0; i < positions.count; i++) {
                    position.x = positions.getX(i);
                    position.y = positions.getY(i);
                    position.z = positions.getZ(i);

                    color.r = colors.getX(i);
                    color.g = colors.getY(i);
                    color.b = colors.getZ(i);

                    let material;
                    let object;

                    if (style === 'Spheres') {
                        material = new THREE.MeshPhongMaterial({ color: color });
                        object = new THREE.Mesh(sphereGeometry, material);
                    } else if (style === 'Wireframe') {
                        material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
                        object = new THREE.Mesh(sphereGeometry, material);
                    } else if (style === 'Points') {
                        material = new THREE.PointsMaterial({ color: color, size: 10 });
                        object = new THREE.Points(sphereGeometry, material);
                    } else if (style === 'Depth') {
                        material = new THREE.MeshDepthMaterial();
                        object = new THREE.Mesh(sphereGeometry, material);
                    } else if (style === 'Normal') {
                        material = new THREE.MeshNormalMaterial();
                        object = new THREE.Mesh(sphereGeometry, material);
                    } else if (style === 'Physical') {
                        material = new THREE.MeshPhysicalMaterial({
                            color: color,
                            metalness: 0.5,
                            roughness: 0.5,
                            reflectivity: 0.5,
                            clearcoat: 1.0,
                            clearcoatRoughness: 0.1
                        });
                        object = new THREE.Mesh(sphereGeometry, material);
                    }

                    object.position.copy(position);
                    object.position.multiplyScalar(75);
                    object.scale.multiplyScalar(25);
                    root.current.add(object);

                    const atom = json.atoms[i];

                    const text = document.createElement('div');
                    text.className = 'label';
                    text.style.color = 'rgb(' + atom[3][0] + ',' + atom[3][1] + ',' + atom[3][2] + ')';
                    text.textContent = atom[4];

                    const label = new CSS2DObject(text);
                    label.position.copy(object.position);
                    root.current.add(label);
                }

                positions = geometryBonds.getAttribute('position');

                const start = new THREE.Vector3();
                const end = new THREE.Vector3();

                // Creating 3D Bonds object
                for (let i = 0; i < positions.count; i += 2) {
                    start.x = positions.getX(i);
                    start.y = positions.getY(i);
                    start.z = positions.getZ(i);

                    end.x = positions.getX(i + 1);
                    end.y = positions.getY(i + 1);
                    end.z = positions.getZ(i + 1);

                    start.multiplyScalar(75);
                    end.multiplyScalar(75);

                    const object = new THREE.Mesh(boxGeometry, new THREE.MeshPhongMaterial({ color: 0xffffff }));
                    object.position.copy(start);
                    object.position.lerp(end, 0.5);
                    object.scale.set(5, 5, start.distanceTo(end));
                    object.lookAt(end);
                    root.current.add(object);
                }
            });
        };

        loadMolecule(model, style);

        // Animation loop for continuous rendering
        const animate = () => {
            const time = Date.now() * 0.0004;
            root.current.rotation.x = time;
            root.current.rotation.y = time * 0.7;

            gl.render(scene, camera);
        };

        // Set the animation function as the function to render every time there is a change in the window
        gl.setAnimationLoop(animate);

        // Update renderer and camera on window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            gl.setSize(window.innerWidth, window.innerHeight);
        });

        // Clean up event listeners and animation loop
        return () => {
            window.removeEventListener('resize', () => {});
            gl.setAnimationLoop(null);
        };
    }, [model, style, scene, camera, gl]);

    return <group ref={root} />;
};

export default MoleculeVisualization;