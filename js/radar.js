// 2D Canvas Parchment Radar rendering for tracking player, enemies, and obstacles (Global Namespace)

window.Game = window.Game || {};

let radarCanvas = null;
let radarCtx = null;

function initRadar() {
    radarCanvas = document.getElementById('radar');
    if (radarCanvas) {
        radarCtx = radarCanvas.getContext('2d');
    }
}

window.Game.updateRadar = function() {
    const state = window.Game.state;
    if (!radarCanvas || !radarCtx) {
        initRadar();
    }
    if (!radarCanvas || !radarCtx) return;

    radarCtx.clearRect(0, 0, 150, 150);
    
    // Scale: 120 grid -> 150 pixels
    const scale = 150 / window.Game.MAP_SIZE;
    const toCanvas = (worldVec) => {
        return {
            x: worldVec.x * scale + 75,
            y: worldVec.z * scale + 75
        };
    };

    // 1. Draw 3D Obstacles (grey blocks)
    state.obstacles.forEach(obs => {
        const rp = toCanvas(new THREE.Vector3(obs.x, 1.5, obs.z));
        const w = obs.width * scale;
        const d = obs.depth * scale;
        radarCtx.fillStyle = '#7a7a8a';
        radarCtx.fillRect(rp.x - w / 2, rp.y - d / 2, w, d);
        radarCtx.strokeStyle = '#4a4a5a';
        radarCtx.lineWidth = 1;
        radarCtx.strokeRect(rp.x - w / 2, rp.y - d / 2, w, d);
    });

    // 2. Draw Buildings (squares scaled to match larger size)
    state.buildings.forEach(b => {
        const rp = toCanvas(b.pos);
        // Unrepaired: Dark brown
        radarCtx.fillStyle = '#4a2e15'; 
        radarCtx.fillRect(rp.x - 5, rp.y - 5, 10, 10);
        
        // Repaired indicator overlay
        if (b.isRepaired) {
            radarCtx.fillStyle = b.hasRelic ? '#ffd700' : '#55aa55';
            radarCtx.fillRect(rp.x - 3, rp.y - 3, 6, 6);
        }
    });

    // 3. Draw Demons (blue flames)
    state.enemies.forEach(e => {
        const rp = toCanvas(e.pos);
        window.Game.drawFlame(radarCtx, rp.x, rp.y, e.isBoss ? 8 : 4, '#00aaff');
    });

    // 4. Draw Player (green dot with white border)
    if (state.player && state.player.pos) {
        const pp = toCanvas(state.player.pos);
        radarCtx.fillStyle = '#00ff00';
        radarCtx.beginPath();
        radarCtx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
        radarCtx.fill();
        radarCtx.strokeStyle = '#ffffff';
        radarCtx.lineWidth = 1;
        radarCtx.stroke();
    }
};

window.Game.drawFlame = function(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size); // Top point
    ctx.bezierCurveTo(x + size, y, x + size, y + size, x, y + size); // Right half curve to bottom
    ctx.bezierCurveTo(x - size, y + size, x - size, y, x, y - size); // Left half curve back to top
    ctx.fill();
};
