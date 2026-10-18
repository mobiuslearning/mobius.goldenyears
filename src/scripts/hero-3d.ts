/**
 * 首页 Hero 3D：一条缓慢流动的「时间隧道」。
 * 轻量：900 个粒子 + 4 个线框圆环；不可见时暂停；尊重 reduced-motion。
 * three.js 动态加载，不影响首屏 HTML。
 */

const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-canvas]');

function supportsWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (probe.getContext('webgl') || probe.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

if (canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && supportsWebGL()) {
    const start = async () => {
      try {
        const THREE = await import('three');
        init(THREE);
      } catch {
        canvas.dataset.webgl = 'unsupported';
      }
    };

    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(start);
    } else {
      setTimeout(start, 200);
    }

    function init(THREE: typeof import('three')) {
      if (!canvas) return;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x16110d, 0.0012);

      const camera = new THREE.PerspectiveCamera(68, 1, 1, 4200);
      camera.position.set(0, 0, 60);
      camera.lookAt(0, 0, -900);

      const count = window.innerWidth < 768 ? 520 : 950;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const speeds = new Float32Array(count);
      const palette = [
        new THREE.Color('#f4ecdc'),
        new THREE.Color('#d19c37'),
        new THREE.Color('#e8b04b'),
        new THREE.Color('#c23b2a'),
        new THREE.Color('#5c9182'),
      ];

      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 90 + Math.random() * 620;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius * 0.72;
        positions[i * 3 + 2] = -Math.random() * 2600;
        const color = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        speeds[i] = 0.55 + Math.random() * 2.2;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 3.4,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // 时间环
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xd19c37,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
      });
      const rings: InstanceType<typeof THREE.Mesh>[] = [];
      for (let i = 0; i < 4; i += 1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(260 + i * 95, 1.1, 4, 48), ringMaterial);
        ring.position.z = -420 - i * 520;
        ring.rotation.x = Math.PI / 2.6;
        scene.add(ring);
        rings.push(ring);
      }

      const pointer = { x: 0, y: 0 };
      let targetX = 0;
      let targetY = 0;

      window.addEventListener(
        'pointermove',
        (event) => {
          targetX = (event.clientX / window.innerWidth - 0.5) * 2;
          targetY = (event.clientY / window.innerHeight - 0.5) * 2;
        },
        { passive: true },
      );

      const resize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

      let visible = true;
      const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && !document.hidden;
        },
        { threshold: 0 },
      );
      visibilityObserver.observe(canvas);

      document.addEventListener('visibilitychange', () => {
        visible = !document.hidden;
      });

      let frame = 0;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        if (!visible) return;

        const time = performance.now() * 0.001;
        const position = geometry.getAttribute('position') as InstanceType<typeof THREE.BufferAttribute>;
        const array = position.array as Float32Array;

        for (let i = 0; i < count; i += 1) {
          array[i * 3 + 2] += speeds[i] * 1.35;
          if (array[i * 3 + 2] > 90) {
            array[i * 3 + 2] = -2600;
            const angle = Math.random() * Math.PI * 2;
            const radius = 90 + Math.random() * 620;
            array[i * 3] = Math.cos(angle) * radius;
            array[i * 3 + 1] = Math.sin(angle) * radius * 0.72;
          }
        }
        position.needsUpdate = true;

        pointer.x += (targetX - pointer.x) * 0.045;
        pointer.y += (targetY - pointer.y) * 0.045;
        camera.position.x = pointer.x * 70;
        camera.position.y = -pointer.y * 44;
        camera.lookAt(pointer.x * 24, -pointer.y * 18, -900);

        rings.forEach((ring, index) => {
          ring.rotation.z = time * (0.05 + index * 0.015);
          ring.position.z += 0.28;
          if (ring.position.z > 120) ring.position.z = -2400;
        });

        points.rotation.z = time * 0.012;
        renderer.render(scene, camera);
      };
      animate();

      window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
    }
  }
}

export {};
