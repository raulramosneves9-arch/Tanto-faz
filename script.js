// Configuração do jogo
let playerX = 0;
let playerY = 0;
const moveSpeed = 15;
const gameContainer = document.querySelector('.game-container');
const containerWidth = gameContainer.offsetWidth;
const containerHeight = gameContainer.offsetHeight;

// Sistema de munição
let ammo = 30;
const maxAmmo = 30;
let kills = 0;
let wave = 1;

// Monstros
let monsters = [];
let nextMonsterId = 0;

// Mouse
let mouseX = 0;
let mouseY = 0;
const player = document.getElementById('player');

// Teclas pressionadas
const keys = {};

// Eventos de teclado
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Controle do mouse
document.addEventListener('mousemove', (e) => {
    const rect = gameContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    rotatePlayer();
});

// Atirar com mouse
document.addEventListener('click', shoot);

// Rotacionar personagem para seguir mouse
function rotatePlayer() {
    const playerRect = player.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    
    const playerCenterX = playerRect.left - containerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top - containerRect.top + playerRect.height / 2;
    
    const angle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);
    player.style.transform = `translate(${playerX}px, calc(-50% + ${playerY}px)) rotate(${angle}rad)`;
}

// Mover jogador
function movePlayer() {
    if (keys['w']) playerY = Math.max(playerY - moveSpeed, -containerHeight / 2 + 40);
    if (keys['s']) playerY = Math.min(playerY + moveSpeed, containerHeight / 2 - 40);
    if (keys['a']) playerX = Math.max(playerX - moveSpeed, -containerWidth / 2 + 30);
    if (keys['d']) playerX = Math.min(playerX + moveSpeed, containerWidth / 2 - 30);
    
    rotatePlayer();
}

// Atirar
function shoot() {
    if (ammo <= 0) return;
    
    ammo--;
    updateAmmo();
    
    const playerRect = player.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const playerCenterX = playerRect.left - containerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top - containerRect.top + playerRect.height / 2;
    
    // Criar bala
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    
    const angle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);
    const speed = 10;
    
    let bulletX = playerCenterX;
    let bulletY = playerCenterY;
    let velX = Math.cos(angle) * speed;
    let velY = Math.sin(angle) * speed;
    
    bullet.style.left = bulletX + 'px';
    bullet.style.top = bulletY + 'px';
    document.getElementById('bullets-container').appendChild(bullet);
    
    // Efeito de disparo
    createMuzzleFlash(playerCenterX + velX * 8, playerCenterY + velY * 8);
    
    // Animar bala
    const bulletInterval = setInterval(() => {
        bulletX += velX;
        bulletY += velY;
        
        bullet.style.left = bulletX + 'px';
        bullet.style.top = bulletY + 'px';
        
        // Checar colisão
        for (let monster of monsters) {
            if (checkCollisionWithMonster(bulletX, bulletY, monster)) {
                clearInterval(bulletInterval);
                bullet.remove();
                damageMonster(monster.id, 25);
                return;
            }
        }
        
        // Remover se sair da tela
        if (bulletX < 0 || bulletX > containerWidth || bulletY < 0 || bulletY > containerHeight) {
            clearInterval(bulletInterval);
            bullet.remove();
        }
    }, 20);
    
    if (ammo === 0) {
        setTimeout(() => {
            ammo = maxAmmo;
            updateAmmo();
        }, 2500);
    }
}

// Criar efeito de disparo
function createMuzzleFlash(x, y) {
    const flash = document.createElement('div');
    flash.className = 'muzzle-flash';
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    document.getElementById('effects-container').appendChild(flash);
    setTimeout(() => flash.remove(), 150);
}

// Checar colisão com monstro
function checkCollisionWithMonster(bulletX, bulletY, monster) {
    const monsterElement = monster.element;
    const monsterRect = monsterElement.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const monsterX = monsterRect.left - containerRect.left;
    const monsterY = monsterRect.top - containerRect.top;
    
    return bulletX > monsterX - 30 && bulletX < monsterX + 50 &&
           bulletY > monsterY - 30 && bulletY < monsterY + 80;
}

// Dar dano ao monstro
function damageMonster(monsterId, damage) {
    const monster = monsters.find(m => m.id === monsterId);
    if (!monster) return;
    
    monster.health -= damage;
    updateMonsterHealth(monster);
    
    // Efeito de dano
    monster.element.style.filter = 'hue-rotate(20deg) brightness(1.3)';
    setTimeout(() => {
        monster.element.style.filter = 'hue-rotate(0deg) brightness(1)';
    }, 100);
    
    if (monster.health <= 0) {
        kills++;
        document.getElementById('kills').textContent = kills;
        monster.element.remove();
        monsters = monsters.filter(m => m.id !== monsterId);
        
        if (monsters.length === 0) {
            nextWave();
        }
    }
}

// Atualizar saúde visual do monstro
function updateMonsterHealth(monster) {
    const healthPercent = (monster.health / monster.maxHealth) * 100;
    const healthBar = monster.element.querySelector('.health-fill');
    if (healthBar) {
        healthBar.style.width = healthPercent + '%';
    }
}

// Atualizar munição
function updateAmmo() {
    document.getElementById('ammo').textContent = ammo;
}

// Próxima onda
function nextWave() {
    wave++;
    document.getElementById('wave').textContent = wave;
    
    const monsterCount = 1 + Math.floor(wave / 2);
    spawnMonsters(monsterCount);
}

// Spawnar monstros
function spawnMonsters(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createMonster();
        }, i * 300);
    }
}

// Criar monstro
function createMonster() {
    const monster = {
        id: nextMonsterId++,
        x: Math.random() * (containerWidth - 100) - containerWidth / 2 + 50,
        y: Math.random() * (containerHeight - 100) - containerHeight / 2 + 50,
        health: 50 + wave * 15,
        maxHealth: 50 + wave * 15,
        speed: 3 + wave * 0.5,
        animation: 0,
        element: null
    };
    
    // Criar elemento
    const monsterDiv = document.createElement('div');
    monsterDiv.className = 'monstro';
    monsterDiv.innerHTML = `
        <div class="health-bar">
            <div class="health-fill"></div>
        </div>
        <div class="corpo-monster">
            <div class="cabeca-monster">
                <div class="olho-m"></div>
                <div class="olho-m"></div>
            </div>
        </div>
        <div class="bracos-monster">
            <div class="braco-m"></div>
            <div class="braco-m"></div>
        </div>
        <div class="torso-monster"></div>
        <div class="pernas-monster">
            <div class="perna-m"></div>
            <div class="perna-m"></div>
        </div>
    `;
    
    document.getElementById('enemies-container').appendChild(monsterDiv);
    monster.element = monsterDiv;
    
    updateMonsterHealth(monster);
    monsters.push(monster);
}

// IA dos monstros
function updateMonsters() {
    const playerRect = player.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const playerCenterX = playerRect.left - containerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top - containerRect.top + playerRect.height / 2;
    
    for (let monster of monsters) {
        // Calcular direção para o jogador
        const dx = playerCenterX - (monster.x + containerWidth / 2);
        const dy = playerCenterY - (monster.y + containerHeight / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            monster.x += (dx / distance) * monster.speed;
            monster.y += (dy / distance) * monster.speed;
        }
        
        // Limites da tela
        monster.x = Math.max(-containerWidth / 2 + 30, Math.min(containerWidth / 2 - 30, monster.x));
        monster.y = Math.max(-containerHeight / 2 + 40, Math.min(containerHeight / 2 - 40, monster.y));
        
        // Atualizar posição e rotação
        const angle = Math.atan2(dy, dx);
        monster.element.style.transform = `translate(${monster.x}px, calc(-50% + ${monster.y}px)) rotate(${angle}rad)`;
        
        // Animação de caminhada
        monster.animation += 0.08;
        const bracos = monster.element.querySelectorAll('.braco-m');
        const pernas = monster.element.querySelectorAll('.perna-m');
        
        bracos.forEach((braco, i) => {
            braco.style.transform = `rotate(${Math.sin(monster.animation + i) * 20}deg)`;
        });
        
        pernas.forEach((perna, i) => {
            perna.style.transform = `translateY(${Math.sin(monster.animation + i) * 5}px)`;
        });
    }
}

// Loop principal
function gameLoop() {
    movePlayer();
    updateMonsters();
    requestAnimationFrame(gameLoop);
}

// Iniciar
updateAmmo();
spawnMonsters(1);
gameLoop();
