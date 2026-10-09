import * as THREE from "three";
import { Terrain } from "./Terrain";

export interface TreePlacementConfig {
	archetype:
		| "sakura"
		| "greenBroadleaf"
		| "autumnBroadleaf"
		| "pine"
		| "smallBackground"
		| "bush"
		| "foregroundFraming";
	x: number;
	z: number;
	scale: number;
	yOffset?: number;
	rotationY?: number;
}

export class Trees {
	public readonly group: THREE.Group;
	private terrain: Terrain;

	private sharedFoliageMaterial: THREE.MeshStandardMaterial;
	private sharedTrunkMaterial: THREE.MeshStandardMaterial;
	private sharedForegroundFoliageMaterial: THREE.MeshStandardMaterial;

	private sakuraCardMaterial: THREE.MeshStandardMaterial;
	private broadleafCardMaterial: THREE.MeshStandardMaterial;
	private autumnCardMaterial: THREE.MeshStandardMaterial;

	constructor(terrain: Terrain) {
		this.group = new THREE.Group();
		this.group.name = "TreesGroup";
		this.terrain = terrain;

		this.sharedFoliageMaterial = new THREE.MeshStandardMaterial({
			vertexColors: true,
			roughness: 0.84,
			metalness: 0.02,
			flatShading: false,
		});

		this.sharedTrunkMaterial = new THREE.MeshStandardMaterial({
			color: 0x483a2e,
			roughness: 0.9,
			metalness: 0.02,
		});

		this.sharedForegroundFoliageMaterial = new THREE.MeshStandardMaterial({
			vertexColors: true,
			roughness: 0.86,
			metalness: 0.02,
			flatShading: false,
		});

		// Silhouette-breaking alpha-tested leaf cluster card materials with soft anime ambient translucency
		this.sakuraCardMaterial = new THREE.MeshStandardMaterial({
			map: this.createSakuraClusterTexture(),
			alphaTest: 0.12,
			vertexColors: true,
			side: THREE.DoubleSide,
			roughness: 0.88,
			emissive: new THREE.Color(0xeaa8bc),
			emissiveIntensity: 0.26,
		});

		this.broadleafCardMaterial = new THREE.MeshStandardMaterial({
			map: this.createBroadleafClusterTexture(),
			alphaTest: 0.12,
			vertexColors: true,
			side: THREE.DoubleSide,
			roughness: 0.88,
			emissive: new THREE.Color(0x608e32),
			emissiveIntensity: 0.24,
		});

		this.autumnCardMaterial = new THREE.MeshStandardMaterial({
			map: this.createAutumnClusterTexture(),
			alphaTest: 0.12,
			vertexColors: true,
			side: THREE.DoubleSide,
			roughness: 0.88,
			emissive: new THREE.Color(0xb24e1e),
			emissiveIntensity: 0.22,
		});

		this.placeTrees();
	}

	/**
	 * Procedural canvas texture for painterly cherry blossom petal tufts.
	 */
	private createSakuraClusterTexture(): THREE.CanvasTexture {
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext("2d")!;

		ctx.clearRect(0, 0, 256, 256);

		const petals = [
			{ cx: 128, cy: 90, r: 42, rot: 0.0 },
			{ cx: 168, cy: 125, r: 38, rot: 1.2 },
			{ cx: 150, cy: 175, r: 40, rot: 2.3 },
			{ cx: 95, cy: 170, r: 39, rot: 3.6 },
			{ cx: 80, cy: 118, r: 37, rot: 4.8 },
			{ cx: 128, cy: 135, r: 32, rot: 0.5 },
		];

		petals.forEach((p) => {
			ctx.save();
			ctx.translate(p.cx, p.cy);
			ctx.rotate(p.rot);
			ctx.beginPath();
			ctx.ellipse(0, 0, p.r * 0.95, p.r * 1.25, 0, 0, Math.PI * 2);
			ctx.fillStyle = "#fce5ed";
			ctx.fill();

			// Soft sunlit petal rim
			ctx.lineWidth = 4;
			ctx.strokeStyle = "#fffbfd";
			ctx.stroke();

			// Subtle deeper petal center
			ctx.beginPath();
			ctx.ellipse(0, 4, p.r * 0.45, p.r * 0.55, 0, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(235, 160, 185, 0.55)";
			ctx.fill();
			ctx.restore();
		});

		const texture = new THREE.CanvasTexture(canvas);
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
		return texture;
	}

	/**
	 * Procedural canvas texture for painterly broadleaf foliage tufts.
	 */
	private createBroadleafClusterTexture(): THREE.CanvasTexture {
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext("2d")!;

		ctx.clearRect(0, 0, 256, 256);

		const leaves = [
			{ cx: 128, cy: 80, rx: 34, ry: 48, rot: 0.1 },
			{ cx: 175, cy: 120, rx: 30, ry: 44, rot: 1.1 },
			{ cx: 155, cy: 178, rx: 32, ry: 46, rot: 2.2 },
			{ cx: 90, cy: 175, rx: 32, ry: 45, rot: 3.8 },
			{ cx: 75, cy: 115, rx: 29, ry: 42, rot: 5.0 },
			{ cx: 128, cy: 135, rx: 36, ry: 38, rot: 0.0 },
		];

		leaves.forEach((l) => {
			ctx.save();
			ctx.translate(l.cx, l.cy);
			ctx.rotate(l.rot);
			ctx.beginPath();
			ctx.ellipse(0, 0, l.rx, l.ry, 0, 0, Math.PI * 2);
			ctx.fillStyle = "#8ab64e";
			ctx.fill();

			ctx.lineWidth = 4;
			ctx.strokeStyle = "#bce668";
			ctx.stroke();

			ctx.beginPath();
			ctx.ellipse(0, 6, l.rx * 0.5, l.ry * 0.5, 0, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(68, 108, 40, 0.45)";
			ctx.fill();
			ctx.restore();
		});

		const texture = new THREE.CanvasTexture(canvas);
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
		return texture;
	}

	/**
	 * Procedural canvas texture for painterly autumn maple leaf tufts.
	 */
	private createAutumnClusterTexture(): THREE.CanvasTexture {
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext("2d")!;

		ctx.clearRect(0, 0, 256, 256);

		const leaves = [
			{
				cx: 128,
				cy: 75,
				rx: 32,
				ry: 48,
				rot: 0.0,
				col: "#f49e42",
				rim: "#fbc56e",
			},
			{
				cx: 180,
				cy: 120,
				rx: 28,
				ry: 44,
				rot: 1.1,
				col: "#e26e2e",
				rim: "#f79a4e",
			},
			{
				cx: 155,
				cy: 180,
				rx: 30,
				ry: 45,
				rot: 2.3,
				col: "#d45624",
				rim: "#ea7e42",
			},
			{
				cx: 88,
				cy: 175,
				rx: 30,
				ry: 45,
				rot: 3.7,
				col: "#df6228",
				rim: "#f38a4c",
			},
			{
				cx: 75,
				cy: 110,
				rx: 28,
				ry: 42,
				rot: 4.9,
				col: "#ea8638",
				rim: "#f9ac58",
			},
			{
				cx: 128,
				cy: 135,
				rx: 35,
				ry: 36,
				rot: 0.0,
				col: "#f6aa48",
				rim: "#fcd07a",
			},
		];

		leaves.forEach((l) => {
			ctx.save();
			ctx.translate(l.cx, l.cy);
			ctx.rotate(l.rot);
			ctx.beginPath();
			ctx.ellipse(0, 0, l.rx, l.ry, 0, 0, Math.PI * 2);
			ctx.fillStyle = l.col;
			ctx.fill();

			ctx.lineWidth = 4;
			ctx.strokeStyle = l.rim;
			ctx.stroke();

			ctx.beginPath();
			ctx.ellipse(0, 5, l.rx * 0.5, l.ry * 0.5, 0, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(120, 45, 20, 0.40)";
			ctx.fill();
			ctx.restore();
		});

		const texture = new THREE.CanvasTexture(canvas);
		texture.generateMipmaps = true;
		texture.needsUpdate = true;
		return texture;
	}

	/**
	 * Generates sculpted anime foliage mass geometry with multi-harmonic clump noise
	 * and stepped painterly vertex shading (darker interiors, luminous sun-facing edges).
	 */
	private createOrganicFoliageLobe(
		radius: number,
		baseColorHex: number,
		sunlitColorHex: number,
		shadowColorHex: number,
		seed: number,
		treeType: "sakura" | "broadleaf" | "autumn" | "pine" = "broadleaf",
	): THREE.BufferGeometry {
		const geo = new THREE.SphereGeometry(radius, 20, 16);
		const pos = geo.attributes.position;
		const vertexCount = pos.count;
		const v = new THREE.Vector3();
		const colors = new Float32Array(vertexCount * 3);

		const baseCol = new THREE.Color(baseColorHex);
		const sunlitCol = new THREE.Color(sunlitColorHex);
		const shadowCol = new THREE.Color(shadowColorHex);
		const sunDir = new THREE.Vector3(38, 50, -38).normalize();
		const tempCol = new THREE.Color();

		for (let i = 0; i < vertexCount; i++) {
			v.fromBufferAttribute(pos, i);

			// Flatten in Y to produce layered anime cloud-like canopy cushions
			v.y *= 0.54;

			const angle = Math.atan2(v.z, v.x);

			if (treeType === "sakura") {
				// Delicate scalloped petal cloud swells
				const scallop =
					Math.abs(Math.sin(angle * 3.0 + seed)) * 0.22 +
					Math.cos(angle * 5.0 + seed * 1.5) * 0.14;
				v.x *= 1.0 + scallop;
				v.z *= 1.0 + scallop;
				v.y += Math.sin(v.x * 2.6 + v.z * 2.6 + seed) * 0.12 * radius;
			} else {
				// Multi-frequency organic leafy clump bulges (broadleaf & autumn)
				const clumpNoise =
					Math.sin(angle * 3.0 + seed) * 0.22 +
					Math.cos(angle * 5.0 + seed * 1.7) * 0.15 +
					Math.sin(angle * 7.0 + seed * 2.3) * 0.08;
				v.x *= 1.0 + clumpNoise;
				v.z *= 1.0 + clumpNoise;
				v.y +=
					(Math.sin(v.x * 2.4 + v.z * 2.4 + seed) * 0.12 +
						Math.cos(v.y * 3.0 + seed) * 0.08) *
					radius;
			}

			pos.setXYZ(i, v.x, v.y, v.z);
		}

		geo.computeVertexNormals();
		const normAttr = geo.attributes.normal;
		const norm = new THREE.Vector3();

		for (let i = 0; i < vertexCount; i++) {
			norm.fromBufferAttribute(normAttr, i);
			const sunFactor = norm.dot(sunDir);
			const isUnderside = norm.y < -0.12;
			const underFactor = isUnderside ? Math.abs(norm.y) * 0.55 : 0.0;

			tempCol.copy(baseCol);
			// Darker foliage interior & undersides
			tempCol.lerp(
				shadowCol,
				THREE.MathUtils.clamp((-sunFactor + 0.38 + underFactor) * 0.90, 0, 1),
			);
			// Luminous sunlit highlights on upper and rightward crests
			tempCol.lerp(
				sunlitCol,
				THREE.MathUtils.clamp((sunFactor - 0.02) * 0.95, 0, 1),
			);

			colors[i * 3] = tempCol.r;
			colors[i * 3 + 1] = tempCol.g;
			colors[i * 3 + 2] = tempCol.b;
		}

		geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
		return geo;
	}

	/**
	 * Generates a tiered conical drooping pine bough umbrella for conifer trees.
	 */
	private createPineBoughTier(
		radius: number,
		height: number,
		pal: { base: number; sunlit: number; shadow: number },
		seed: number
	): THREE.BufferGeometry {
		const segments = 16;
		const geo = new THREE.ConeGeometry(radius, height, segments, 4, false);
		const pos = geo.attributes.position;
		const vertexCount = pos.count;
		const v = new THREE.Vector3();
		const sunDir = new THREE.Vector3(38, 50, -38).normalize();
		const baseCol = new THREE.Color(pal.base);
		const sunlitCol = new THREE.Color(pal.sunlit);
		const shadowCol = new THREE.Color(pal.shadow);
		const tempCol = new THREE.Color();

		for (let i = 0; i < vertexCount; i++) {
			v.fromBufferAttribute(pos, i);
			const angle = Math.atan2(v.z, v.x);
			const heightT = THREE.MathUtils.clamp((v.y + height * 0.5) / height, 0, 1);

			// Scalloped drooping needle fringe expanding towards bottom
			const needleScallop =
				(Math.sin(angle * 8.0 + seed) * 0.16 + Math.cos(angle * 4.0 + seed * 1.3) * 0.12) *
				(1.0 - heightT);
			v.x *= 1.0 + needleScallop;
			v.z *= 1.0 + needleScallop;

			// Drooping downward curve towards outer tips
			if (heightT < 0.35) {
				v.y -= Math.abs(needleScallop) * 0.35 * height;
			}

			pos.setXYZ(i, v.x, v.y, v.z);
		}

		const nonIndexed = geo.toNonIndexed();
		nonIndexed.computeVertexNormals();
		const niCount = nonIndexed.attributes.position.count;
		const niNormAttr = nonIndexed.attributes.normal;
		const niNorm = new THREE.Vector3();
		const niColors = new Float32Array(niCount * 3);

		for (let i = 0; i < niCount; i++) {
			niNorm.fromBufferAttribute(niNormAttr, i);
			const sunFactor = niNorm.dot(sunDir);
			const isUnderside = niNorm.y < 0.1;

			tempCol.copy(baseCol);
			if (isUnderside) {
				tempCol.lerp(shadowCol, 0.75);
			} else if (sunFactor > 0.05) {
				tempCol.lerp(sunlitCol, 0.35 + sunFactor * 0.65);
			} else {
				tempCol.lerp(shadowCol, 0.45);
			}

			niColors[i * 3] = tempCol.r;
			niColors[i * 3 + 1] = tempCol.g;
			niColors[i * 3 + 2] = tempCol.b;
		}

		nonIndexed.setAttribute("color", new THREE.BufferAttribute(niColors, 3));
		return nonIndexed;
	}

	/**
	 * Generates a single merged mesh containing small irregular leaf cluster cards
	 * placed along the perimeter of all lobes of a tree to break smooth blob silhouettes.
	 */
	private createFoliageRimCardsMesh(
		lobes: { x: number; y: number; z: number; r: number; s: number }[],
		pal: { base: number; sunlit: number; shadow: number },
		material: THREE.MeshStandardMaterial,
	): THREE.Mesh {
		const sunDir = new THREE.Vector3(38, 50, -38).normalize();
		const baseCol = new THREE.Color(pal.base);
		const sunlitCol = new THREE.Color(pal.sunlit);
		const shadowCol = new THREE.Color(pal.shadow);

		const positions: number[] = [];
		const normals: number[] = [];
		const uvs: number[] = [];
		const colors: number[] = [];
		const indices: number[] = [];

		let vertOffset = 0;

		lobes.forEach((l) => {
			const cardCount = Math.floor(16 + l.r * 3.6);
			const cardSize = l.r * 0.15; // Snug delicate frill tufts

			for (let c = 0; c < cardCount; c++) {
				const theta =
					(c / cardCount) * Math.PI * 2 + Math.sin(c * 2.3 + l.s) * 0.5 * 0.35;
				const phi = Math.cos(c * 3.7 + l.s) * 0.5 * 0.60;
				// Compute matching scallop so card stays tightly attached to deformed mesh surface
				const scallop =
					Math.sin(theta * 3.0 + l.s) * 0.14 +
					Math.cos(theta * 5.0 + l.s * 1.7) * 0.08;
				// Inner half of quad is embedded in lobe body, only outer scalloped tips break silhouette
				const rOut = l.r * (1.0 + scallop) * 0.92;

				const px = l.x + Math.cos(theta) * Math.cos(phi) * rOut;
				const py = l.y + Math.sin(phi) * rOut * 0.54;
				const pz = l.z + Math.sin(theta) * Math.cos(phi) * rOut;

				const outDir = new THREE.Vector3(
					px - l.x,
					(py - l.y) * 1.4,
					pz - l.z,
				).normalize();

				// Blend orientation towards sky and camera so quads never appear edge-on
				const camNormal = new THREE.Vector3(0.08, 0.82, 0.56);
				const quadNormal = new THREE.Vector3().lerpVectors(outDir, camNormal, 0.45).normalize();
				const cardNormal = new THREE.Vector3(
					quadNormal.x * 0.3 + sunDir.x * 0.25,
					Math.max(0.50, quadNormal.y + 0.30),
					quadNormal.z * 0.3 + sunDir.z * 0.25,
				).normalize();
				const sunFactor = outDir.dot(sunDir);

				const cardColor = baseCol.clone();
				cardColor.lerp(
					shadowCol,
					THREE.MathUtils.clamp((-sunFactor + 0.1) * 0.40, 0, 0.40),
				);
				cardColor.lerp(
					sunlitCol,
					THREE.MathUtils.clamp((sunFactor + 0.1) * 0.70, 0, 1),
				);

				const up = new THREE.Vector3(0, 1, 0);
				const right = new THREE.Vector3().crossVectors(quadNormal, up).normalize();
				if (right.lengthSq() < 0.01) right.set(1, 0, 0);
				const cardUp = new THREE.Vector3()
					.crossVectors(right, quadNormal)
					.normalize();

				const half = cardSize * 0.5;

				const v0 = new THREE.Vector3(px, py, pz)
					.addScaledVector(right, -half)
					.addScaledVector(cardUp, -half);
				const v1 = new THREE.Vector3(px, py, pz)
					.addScaledVector(right, half)
					.addScaledVector(cardUp, -half);
				const v2 = new THREE.Vector3(px, py, pz)
					.addScaledVector(right, half)
					.addScaledVector(cardUp, half);
				const v3 = new THREE.Vector3(px, py, pz)
					.addScaledVector(right, -half)
					.addScaledVector(cardUp, half);

				[v0, v1, v2, v3].forEach((v) => {
					positions.push(v.x, v.y, v.z);
					normals.push(cardNormal.x, cardNormal.y, cardNormal.z);
					colors.push(cardColor.r, cardColor.g, cardColor.b);
				});

				uvs.push(0, 0, 1, 0, 1, 1, 0, 1);

				indices.push(
					vertOffset,
					vertOffset + 1,
					vertOffset + 2,
					vertOffset,
					vertOffset + 2,
					vertOffset + 3,
				);

				vertOffset += 4;
			}
		});

		const geo = new THREE.BufferGeometry();
		geo.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(positions, 3),
		);
		geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
		geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
		geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
		geo.setIndex(indices);

		const mesh = new THREE.Mesh(geo, material);
		mesh.castShadow = false;
		mesh.receiveShadow = false;
		return mesh;
	}

	private createTrunk(
		height: number,
		bottomRadius: number,
		topRadius: number,
	): THREE.Mesh {
		const geo = new THREE.CylinderGeometry(
			topRadius,
			bottomRadius,
			height,
			10,
			5,
		);
		const pos = geo.attributes.position;
		const vertexCount = pos.count;

		for (let i = 0; i < vertexCount; i++) {
			let x = pos.getX(i);
			let y = pos.getY(i);
			let z = pos.getZ(i);

			if (y < -height * 0.25) {
				const flare = 1.0 + ((-height * 0.25 - y) / (height * 0.25)) * 0.65;
				x *= flare;
				z *= flare;
			}

			x += Math.sin((y / height) * Math.PI) * 0.1 * height;

			pos.setXYZ(i, x, y, z);
		}

		geo.computeVertexNormals();
		geo.translate(0, height * 0.5, 0);
		const trunk = new THREE.Mesh(geo, this.sharedTrunkMaterial);
		trunk.castShadow = true;
		trunk.receiveShadow = true;
		return trunk;
	}

	private createBranch(
		length: number,
		startRadius: number,
		endRadius: number,
		curveBend: number = 0.1,
	): THREE.Mesh {
		const geo = new THREE.CylinderGeometry(
			endRadius,
			startRadius,
			length,
			8,
			4,
		);
		const pos = geo.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			let x = pos.getX(i);
			let y = pos.getY(i);
			let z = pos.getZ(i);
			x += Math.sin((y / length) * Math.PI) * curveBend * length;
			pos.setXYZ(i, x, y, z);
		}
		geo.computeVertexNormals();
		geo.translate(0, length * 0.5, 0);
		const branch = new THREE.Mesh(geo, this.sharedTrunkMaterial);
		branch.castShadow = true;
		return branch;
	}

	/**
	 * 1. Sakura Tree
	 * Spreading branching silhouette with 12 dense, overlapping blossom cloud cushions.
	 */
	private createSakuraTree(seed: number = 1.0): THREE.Group {
		const tree = new THREE.Group();

		// Sturdy gnarled Japanese cherry trunk, lower spreading profile
		const trunk = this.createTrunk(2.8, 0.44, 0.28);
		tree.add(trunk);

		const branches = [
			{ len: 2.6, rx: 0.3, rz: 0.48, ry: 0.4, y: 1.8 },
			{ len: 2.4, rx: -0.22, rz: -0.44, ry: 2.1, y: 2.0 },
			{ len: 2.2, rx: 0.16, rz: -0.36, ry: 4.1, y: 2.2 },
		];

		branches.forEach((b) => {
			const branchMesh = this.createBranch(b.len, 0.22, 0.12, 0.16);
			branchMesh.position.y = b.y;
			branchMesh.rotation.set(b.rx, b.ry, b.rz);
			tree.add(branchMesh);
		});

		const pal = {
			base: 0xebb4c2, // Soft pastel cherry blossom
			sunlit: 0xffe8f0, // Luminous radiant sunlit white-pink highlight
			shadow: 0x9a5a72, // Cool plum/mauve underside shadow
		};

		// 12 primary fluffy cloud cushions + 6 satellite child lobes breaking circular silhouettes
		const lobes = [
			{ x: 0.0, y: 3.6, z: 0.0, r: 2.3, s: seed + 0.1 },
			{ x: -1.6, y: 3.1, z: 0.8, r: 1.9, s: seed + 0.4 },
			{ x: 1.5, y: 3.3, z: -0.6, r: 1.8, s: seed + 0.8 },
			{ x: 0.2, y: 4.2, z: 0.5, r: 1.7, s: seed + 1.2 },
			{ x: -0.8, y: 3.8, z: -1.1, r: 1.6, s: seed + 1.6 },
			{ x: 1.6, y: 2.9, z: 1.1, r: 1.6, s: seed + 2.0 },
			{ x: -2.0, y: 2.7, z: -0.8, r: 1.6, s: seed + 2.4 },
			{ x: 0.0, y: 2.6, z: 1.5, r: 1.5, s: seed + 2.8 },
			{ x: -1.1, y: 3.5, z: 1.3, r: 1.4, s: seed + 3.2 },
			{ x: 1.2, y: 3.6, z: 0.7, r: 1.5, s: seed + 3.6 },
			{ x: 0.9, y: 2.8, z: -1.3, r: 1.4, s: seed + 4.0 },
			{ x: -0.6, y: 2.5, z: -1.5, r: 1.3, s: seed + 4.4 },
			// Satellite child cloud puffs breaking outer silhouette into organic billows
			{ x: -2.3, y: 3.3, z: 0.1, r: 1.15, s: seed + 5.1 },
			{ x: 1.9, y: 3.5, z: -0.2, r: 1.10, s: seed + 5.5 },
			{ x: 0.1, y: 4.4, z: -0.9, r: 1.15, s: seed + 5.9 },
			{ x: -0.3, y: 2.8, z: 1.8, r: 1.05, s: seed + 6.3 },
			{ x: 1.6, y: 2.5, z: 0.4, r: 1.10, s: seed + 6.7 },
			{ x: -1.7, y: 2.4, z: -1.3, r: 1.05, s: seed + 7.1 },
		];

		lobes.forEach((l) => {
			const geo = this.createOrganicFoliageLobe(
				l.r,
				pal.base,
				pal.sunlit,
				pal.shadow,
				l.s,
				"sakura",
			);
			const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
			mesh.position.set(l.x, l.y, l.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			tree.add(mesh);
		});

		const rimCards = this.createFoliageRimCardsMesh(
			lobes,
			pal,
			this.sakuraCardMaterial,
		);
		tree.add(rimCards);

		return tree;
	}

	/**
	 * 2. Mature Green Broadleaf
	 */
	private createGreenBroadleaf(seed: number = 2.0): THREE.Group {
		const tree = new THREE.Group();

		const trunk = this.createTrunk(4.5, 0.52, 0.32);
		tree.add(trunk);

		const branch1 = this.createBranch(3.0, 0.24, 0.13, 0.14);
		branch1.position.y = 3.0;
		branch1.rotation.set(0.3, 0.4, 0.4);
		tree.add(branch1);

		const branch2 = this.createBranch(2.8, 0.22, 0.12, -0.12);
		branch2.position.y = 3.2;
		branch2.rotation.set(-0.25, 2.4, -0.35);
		tree.add(branch2);

		const pal = {
			base: 0x729e46, // Warm natural anime olive-green
			sunlit: 0xa4d068, // Golden sunlight highlight
			shadow: 0x365426, // Cool shaded green
		};

		const lobes = [
			{ x: 0.0, y: 5.2, z: 0.0, r: 2.4, s: seed + 0.1 },
			{ x: -1.3, y: 4.5, z: 0.6, r: 1.9, s: seed + 0.6 },
			{ x: 1.2, y: 4.7, z: -0.5, r: 1.8, s: seed + 1.1 },
			{ x: 0.2, y: 5.9, z: 0.4, r: 1.7, s: seed + 1.6 },
			{ x: -0.6, y: 5.4, z: -0.9, r: 1.6, s: seed + 2.1 },
			{ x: 1.4, y: 4.0, z: 0.9, r: 1.5, s: seed + 2.6 },
			{ x: -1.6, y: 4.1, z: -0.6, r: 1.6, s: seed + 3.1 },
			{ x: 0.0, y: 3.7, z: 1.2, r: 1.4, s: seed + 3.6 },
			// Satellite clumps breaking outline into asymmetrical clusters
			{ x: -1.8, y: 4.8, z: 0.2, r: 1.15, s: seed + 4.1 },
			{ x: 1.6, y: 5.1, z: -0.3, r: 1.10, s: seed + 4.6 },
			{ x: 0.1, y: 6.2, z: -0.5, r: 1.15, s: seed + 5.1 },
			{ x: -0.8, y: 3.6, z: 1.4, r: 1.05, s: seed + 5.6 },
		];

		lobes.forEach((l) => {
			const geo = this.createOrganicFoliageLobe(
				l.r,
				pal.base,
				pal.sunlit,
				pal.shadow,
				l.s,
				"broadleaf",
			);
			const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
			mesh.position.set(l.x, l.y, l.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			tree.add(mesh);
		});

		const rimCards = this.createFoliageRimCardsMesh(
			lobes,
			pal,
			this.broadleafCardMaterial,
		);
		tree.add(rimCards);

		return tree;
	}

	/**
	 * 3. Autumn Broadleaf
	 */
	private createAutumnBroadleaf(seed: number = 3.0): THREE.Group {
		const tree = new THREE.Group();

		const trunk = this.createTrunk(4.2, 0.46, 0.28);
		tree.add(trunk);

		const palAmber = {
			base: 0xdc782e,
			sunlit: 0xf6b654,
			shadow: 0x782c14,
		};

		const palRusset = {
			base: 0xc45026,
			sunlit: 0xec7238,
			shadow: 0x641e0a,
		};

		const lobes = [
			{ x: 0.0, y: 4.9, z: 0.0, r: 2.2, pal: palAmber, s: seed + 0.1 },
			{ x: -1.1, y: 4.2, z: 0.5, r: 1.8, pal: palRusset, s: seed + 0.7 },
			{ x: 1.1, y: 4.4, z: -0.4, r: 1.7, pal: palAmber, s: seed + 1.3 },
			{ x: 0.2, y: 5.6, z: 0.3, r: 1.6, pal: palAmber, s: seed + 1.9 },
			{ x: -0.5, y: 5.1, z: -0.7, r: 1.5, pal: palRusset, s: seed + 2.5 },
			{ x: 1.3, y: 3.8, z: 0.7, r: 1.5, pal: palAmber, s: seed + 3.1 },
			{ x: -1.2, y: 3.7, z: -0.5, r: 1.4, pal: palRusset, s: seed + 3.7 },
			// Satellite clumps breaking outline into asymmetrical clusters
			{ x: -1.5, y: 4.5, z: 0.2, r: 1.10, pal: palRusset, s: seed + 4.3 },
			{ x: 1.4, y: 4.7, z: -0.2, r: 1.05, pal: palAmber, s: seed + 4.9 },
			{ x: 0.1, y: 5.9, z: -0.4, r: 1.10, pal: palAmber, s: seed + 5.5 },
			{ x: -0.7, y: 3.5, z: 1.1, r: 1.00, pal: palRusset, s: seed + 6.1 },
		];

		lobes.forEach((l) => {
			const geo = this.createOrganicFoliageLobe(
				l.r,
				l.pal.base,
				l.pal.sunlit,
				l.pal.shadow,
				l.s,
				"autumn",
			);
			const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
			mesh.position.set(l.x, l.y, l.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			tree.add(mesh);
		});

		const rimCards = this.createFoliageRimCardsMesh(
			lobes.map((l) => ({ x: l.x, y: l.y, z: l.z, r: l.r, s: l.s })),
			palAmber,
			this.autumnCardMaterial,
		);
		tree.add(rimCards);

		return tree;
	}

	/**
	 * 4. Pine / Conifer (Tiered drooping conifer umbrella boughs)
	 */
	private createPineTree(seed: number = 4.0): THREE.Group {
		const tree = new THREE.Group();

		const trunk = this.createTrunk(6.8, 0.4, 0.2);
		tree.add(trunk);

		const pal = {
			base: 0x183428,
			sunlit: 0x2e5c42,
			shadow: 0x0c1e16,
		};

		const tierConfigs = [
			{ r: 2.6, h: 1.8, y: 3.5 },
			{ r: 2.2, h: 1.7, y: 4.8 },
			{ r: 1.8, h: 1.6, y: 6.0 },
			{ r: 1.4, h: 1.5, y: 7.1 },
			{ r: 0.9, h: 1.3, y: 8.1 },
		];

		const tierLobes: {
			x: number;
			y: number;
			z: number;
			r: number;
			s: number;
		}[] = [];

		tierConfigs.forEach((cfg, t) => {
			tierLobes.push({
				x: 0,
				y: cfg.y,
				z: 0,
				r: cfg.r,
				s: seed + t * 1.7,
			});

			const geo = this.createPineBoughTier(
				cfg.r,
				cfg.h,
				pal,
				seed + t * 1.7,
			);

			const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
			mesh.position.y = cfg.y;
			mesh.rotation.y = t * 0.85;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			tree.add(mesh);
		});

		return tree;
	}

	/**
	 * 5. Small Background Tree
	 */
	private createSmallBackgroundTree(seed: number = 5.0): THREE.Group {
		const tree = new THREE.Group();

		const trunk = this.createTrunk(2.8, 0.28, 0.16);
		tree.add(trunk);

		const pal = {
			base: 0x628456,
			sunlit: 0x86a874,
			shadow: 0x3d5438,
		};

		const lobes = [
			{ x: 0.0, y: 3.2, z: 0.0, r: 1.6, s: seed + 0.2 },
			{ x: -0.6, y: 2.7, z: 0.4, r: 1.3, s: seed + 0.8 },
			{ x: 0.6, y: 2.8, z: -0.3, r: 1.2, s: seed + 1.4 },
		];

		lobes.forEach((l) => {
			const geo = this.createOrganicFoliageLobe(
				l.r,
				pal.base,
				pal.sunlit,
				pal.shadow,
				l.s,
				"broadleaf",
			);
			const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
			mesh.position.set(l.x, l.y, l.z);
			mesh.castShadow = true;
			tree.add(mesh);
		});

		const rimCards = this.createFoliageRimCardsMesh(
			lobes,
			pal,
			this.broadleafCardMaterial,
		);
		tree.add(rimCards);

		return tree;
	}

	/**
	 * 6. Bush / Shrub
	 */
	private createBush(seed: number = 6.0): THREE.Group {
		const bush = new THREE.Group();

		const pal = {
			base: 0x5b7e36,
			sunlit: 0x8ab554,
			shadow: 0x354b20,
		};

		const lobes = [
			{ x: 0.0, y: 0.7, z: 0.0, r: 1.2, s: seed + 0.1 },
			{ x: 0.6, y: 0.5, z: 0.4, r: 0.9, s: seed + 0.6 },
			{ x: -0.5, y: 0.5, z: -0.3, r: 1.0, s: seed + 1.2 },
		];

		lobes.forEach((l) => {
			const geo = this.createOrganicFoliageLobe(
				l.r,
				pal.base,
				pal.sunlit,
				pal.shadow,
				l.s,
				"broadleaf",
			);
			const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
			mesh.position.set(l.x, l.y, l.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			bush.add(mesh);
		});

		const rimCards = this.createFoliageRimCardsMesh(
			lobes,
			pal,
			this.broadleafCardMaterial,
		);
		bush.add(rimCards);

		return bush;
	}

	/**
	 * 7. Foreground Framing Tree
	 */
	private createForegroundFramingTree(seed: number = 7.0): THREE.Group {
		const tree = new THREE.Group();

		const trunk = this.createTrunk(7.5, 0.6, 0.3);
		tree.add(trunk);

		const pal = {
			base: 0x142e22, // Deep forest evergreen
			sunlit: 0x2a543e, // Sunlit needle tips
			shadow: 0x081810, // Deep shadowy underside
		};

		const tierConfigs = [
			{ r: 3.0, h: 2.1, y: 3.8 },
			{ r: 2.5, h: 2.0, y: 5.3 },
			{ r: 2.0, h: 1.8, y: 6.7 },
			{ r: 1.5, h: 1.6, y: 8.0 },
			{ r: 1.0, h: 1.4, y: 9.1 },
		];

		const tierLobes: {
			x: number;
			y: number;
			z: number;
			r: number;
			s: number;
		}[] = [];

		tierConfigs.forEach((cfg, t) => {
			tierLobes.push({
				x: 0,
				y: cfg.y,
				z: 0,
				r: cfg.r,
				s: seed + t * 1.8,
			});

			const geo = this.createPineBoughTier(
				cfg.r,
				cfg.h,
				pal,
				seed + t * 1.8,
			);

			const mesh = new THREE.Mesh(geo, this.sharedForegroundFoliageMaterial);
			mesh.position.y = cfg.y;
			mesh.rotation.y = t * 0.85;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			tree.add(mesh);
		});

		return tree;
	}

	// ==========================================
	// HAND-AUTHORED PLACEMENT
	// ==========================================
	private placeTrees(): void {
		const treePlacements: TreePlacementConfig[] = [
			// ----------------------------------------
			// Left Meadow: Cottage & Foothill Groves
			// ----------------------------------------
			// Sakura sheltering right over countryside cottage
			{ archetype: "sakura", x: -24, z: -19, scale: 2.2, rotationY: 0.3 },
			// Sakura grove slightly further back on meadow slope
			{ archetype: "sakura", x: -32, z: -14, scale: 2.1, rotationY: 1.1 },
			// Meadow Broadleaf behind cottage clearing
			{
				archetype: "greenBroadleaf",
				x: -16,
				z: -25,
				scale: 1.9,
				rotationY: 0.7,
			},
			// Lower meadow oak near pathway bend
			{
				archetype: "greenBroadleaf",
				x: -21,
				z: -4,
				scale: 1.8,
				rotationY: 2.0,
			},
			// Meadow terrace tree
			{ archetype: "greenBroadleaf", x: -25, z: 8, scale: 1.8, rotationY: 1.4 },
			// Shrubs around cottage and meadow rocks
			{ archetype: "bush", x: -23, z: -13, scale: 1.3 },
			{ archetype: "bush", x: -16, z: -18, scale: 1.2 },
			{ archetype: "bush", x: -22, z: 2, scale: 1.3 },

			// ----------------------------------------
			// Right Bluff: Forested Hillside & Autumn Canopy
			// ----------------------------------------
			// Sunlit Autumn trees catching afternoon light
			{
				archetype: "autumnBroadleaf",
				x: 26,
				z: -8,
				scale: 2.3,
				rotationY: 0.5,
			},
			{ archetype: "autumnBroadleaf", x: 27, z: 6, scale: 2.2, rotationY: 1.7 },
			// Hillside oak on upper ridge
			{
				archetype: "greenBroadleaf",
				x: 34,
				z: -18,
				scale: 2.5,
				rotationY: 0.4,
			},
			// Mountain pines on upper slope
			{ archetype: "pine", x: 32, z: -26, scale: 2.4, rotationY: 0.9 },
			{ archetype: "pine", x: 38, z: -20, scale: 2.6, rotationY: 2.3 },

			// ----------------------------------------
			// Distant Background Fillers
			// ----------------------------------------
			{ archetype: "smallBackground", x: -44, z: -38, scale: 1.8 },
			{ archetype: "smallBackground", x: -36, z: -44, scale: 1.9 },
			{ archetype: "smallBackground", x: 44, z: -14, scale: 2.0 },
			{ archetype: "smallBackground", x: 38, z: 16, scale: 1.8 },
			{ archetype: "smallBackground", x: 42, z: 24, scale: 1.7 },

			// ----------------------------------------
			// Bottom-Left Foreground Sakura Accent
			// ----------------------------------------
			{ archetype: "sakura", x: -44, z: 34, scale: 2.0, rotationY: 0.5 },

			// ----------------------------------------
			// Bottom-Right Foreground Cinematic Framing
			// ----------------------------------------
			{
				archetype: "foregroundFraming",
				x: 36,
				z: 44,
				scale: 2.8,
				yOffset: -12,
				rotationY: 0.3,
			},
			{
				archetype: "foregroundFraming",
				x: 44,
				z: 46,
				scale: 3.2,
				yOffset: -14,
				rotationY: 1.1,
			},
			{
				archetype: "foregroundFraming",
				x: 28,
				z: 50,
				scale: 2.4,
				yOffset: -8,
				rotationY: 2.0,
			},
			{
				archetype: "foregroundFraming",
				x: 40,
				z: 54,
				scale: 3.0,
				yOffset: -14,
				rotationY: 0.7,
			},
		];

		treePlacements.forEach((p, idx) => {
			let treeGroup: THREE.Group;

			switch (p.archetype) {
				case "sakura":
					treeGroup = this.createSakuraTree(idx * 2.3 + 1.1);
					break;
				case "greenBroadleaf":
					treeGroup = this.createGreenBroadleaf(idx * 2.3 + 1.1);
					break;
				case "autumnBroadleaf":
					treeGroup = this.createAutumnBroadleaf(idx * 2.3 + 1.1);
					break;
				case "pine":
					treeGroup = this.createPineTree(idx * 2.3 + 1.1);
					break;
				case "smallBackground":
					treeGroup = this.createSmallBackgroundTree(idx * 2.3 + 1.1);
					break;
				case "bush":
					treeGroup = this.createBush(idx * 2.3 + 1.1);
					break;
				case "foregroundFraming":
					treeGroup = this.createForegroundFramingTree(idx * 2.3 + 1.1);
					break;
			}

			const tInfo = this.terrain.getHeightAt(p.x, p.z);
			const groundY = tInfo.y + (p.yOffset ?? 0);

			treeGroup.position.set(p.x, groundY, p.z);
			treeGroup.scale.setScalar(p.scale);
			if (p.rotationY !== undefined) {
				treeGroup.rotation.y = p.rotationY;
			}

			this.group.add(treeGroup);
		});
	}
}
