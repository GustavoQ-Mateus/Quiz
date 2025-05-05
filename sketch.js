let perguntas = [];
let perguntaAtual;
let pontos = 0;
let vidas = 3;
let jogoIniciado = false;
let tempoRestante = 10;
let timer;
let perguntasRespondidas = 0;
let perguntasSelecionadas = [];
let respostaMostrada = false;
let respostaCorretaAtual = false;
let explicacaoAtual = "";
let fimDeJogoAguardando = false;
let tempoFimDeJogo = 0;
let particulas = [];
let score = 0
let combo = 0
let maxcombo = 0
let lastAnswerTime = 0
let comboTimer = 0
const numParticulas = 60;

function setup() {
  let container = document.getElementById('p5-canvas');
  let computedStyle = window.getComputedStyle(container);
  let paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
  let paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

  let canvas = createCanvas(container.offsetWidth - paddingX, container.offsetHeight - paddingY);
  canvas.parent('p5-canvas');
  textAlign(CENTER, CENTER);
  textSize(18);
  gerarPerguntas();
  gerarPartida();

  for (let i = 0; i < numParticulas; i++) {
      particulas.push({
          x: random(width),
          y: random(height),
          r: random(2, 5),
          dx: random(-0.5, 0.5),
          dy: random(-0.5, 0.5),
          alpha: random(100, 200)
      });
  }

  windowResized();
}

function windowResized() {
  let container = document.getElementById('p5-canvas');
  let computedStyle = window.getComputedStyle(container);
  let paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
  let paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

  resizeCanvas(container.offsetWidth - paddingX, container.offsetHeight - paddingY);
}

function draw() {
    background(240, 242, 245);
    
    // Atualiza displays HTML
    document.getElementById('pontos-display').textContent = pontos;
    document.getElementById('vidas-display').textContent = vidas;

    // Container principal do jogo
    fill(255);
    noStroke();
    rect(0, 0, width, height);

    if (!jogoIniciado) {
      background(240, 242, 245); // fundo claro
  
      // Partículas
      noStroke();
      for (let p of particulas) {
          fill(67, 97, 238, p.alpha); // tom azul com transparência
          ellipse(p.x, p.y, p.r);
  
          p.x += p.dx;
          p.y += p.dy;
  
          // rebote leve nas bordas
          if (p.x < 0 || p.x > width) p.dx *= -1;
          if (p.y < 0 || p.y > height) p.dy *= -1;
      }
  
      // Título e instrução
      fill(67, 97, 238);
      textSize(32);
      text("DUELO DA LÓGICA", width/2, height/2 - 40);
  
      fill(120);
      textSize(18);
      text("Clique para começar", width/2, height/2 + 20);
      return;
  }

    if (!jogoIniciado) {
        // Tela inicial
        fill(67, 97, 238);
        textSize(32);
        text("DUELO DA LÓGICA", width/2, height/2 - 40);
        
        fill(120);
        textSize(18);
        text("Clique para começar", width/2, height/2 + 20);
        return;
    }

    // Dificuldade
    textSize(18);
    if (perguntaAtual.dificuldade === "Fácil") fill(76, 201, 240);
    else if (perguntaAtual.dificuldade === "Normal") fill(248, 150, 30);
    else if (perguntaAtual.dificuldade === "Médio") fill(243, 114, 44);
    else fill(239, 35, 60);
    text(`Dificuldade: ${perguntaAtual.dificuldade}`, width/2, 40);

    // Pares da relação
    fill(33, 37, 41);
    textSize(16);
    textStyle(BOLD);
    text("Pares da relação:", width/2, 70);
    
    fill(73, 80, 87);
    textSize(14);
    textStyle(NORMAL);
    text(perguntaAtual.pares.map(p => `(${p[0]},${p[1]})`).join(", "), width/2, 100);

    // Pergunta
    fill(33, 37, 41);
    textSize(20);
    textStyle(BOLD);
    text(perguntaAtual.pergunta, width/2, 140);

    // Timer
    fill(233, 236, 239);
    noStroke();
    rect(width/2 - 150, 170, 300, 8, 4);
    fill(67, 97, 238);
    rect(width/2 - 150, 170, 300 * (tempoRestante/10), 8, 4);

    // Botões de resposta
    if (!respostaMostrada) {
        const btns = ["Sim", "Não"];
        const btnWidth = 120;
        const spacing = 40;
        const totalWidth = (btns.length * btnWidth) + ((btns.length - 1) * spacing);
        const startX = width/2 - totalWidth/2;

        for (let i = 0; i < btns.length; i++) {
            drawModernButton(
                btns[i], 
                startX + i * (btnWidth + spacing), 
                220, 
                btnWidth, 
                50
            );
        }
    }

    // Mostra feedback se necessário
    if (respostaMostrada) {
        fill(respostaCorretaAtual ? "#27ae60" : "#e74c3c");
        textSize(24);
        text(respostaCorretaAtual ? "✓ Correto! +10 pontos" : "✗ Errado! -1 vida", width/2, 290);
        
        // Caixa de explicação
        fill(245, 245, 245);
        stroke(200);
        rect(50, 320, width - 100, 120, 10);
        fill(33, 37, 41);
        textSize(14);
        textAlign(LEFT, TOP);
        text(explicacaoAtual, 70, 340, width - 140);
        textAlign(CENTER, CENTER);
        
        // Botão para continuar
        drawContinueButton();
    }

    // Fim de jogo
    if ((vidas <= 0 || perguntasRespondidas >= 8) && fimDeJogoAguardando) {
      if (millis() - tempoFimDeJogo > 2000) { // espera 2 segundos
          drawEndGame();
      }
  }
}

function drawModernButton(label, x, y, w, h) {
    const isHover = mouseInside(x, y, w, h);
    const isSim = label === "Sim";
    
    fill(isSim ? (isHover ? "#2ecc71" : "#27ae60") : (isHover ? "#e74c3c" : "#c0392b"));
    noStroke();
    rect(x, y, w, h, 8);
    
    fill(255);
    textSize(18);
    textStyle(BOLD);
    text(label, x + w/2, y + h/2);
}

function drawContinueButton() {
    const x = width / 2 - 75;
    const y = 460;
    const w = 150;
    const h = 45;
    
    const isHover = mouseInside(x, y, w, h);
    
    fill(isHover ? "#4361ee" : "#3a0ca3");
    noStroke();
    rect(x, y, w, h, 8);
    
    fill(255);
    textSize(16);
    text("Continuar", width/2, y + h/2 + 2);
}

function drawEndGame() {
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    fill(255);
    stroke(222, 226, 230);
    strokeWeight(1);
    rect(width/2 - 200, height/2 - 150, 400, 300, 20);
    
    fill(33, 37, 41);
    textSize(28);
    text("FIM DE JOGO", width/2, height/2 - 80);
    
    textSize(20);
    text(`Pontuação Final: ${pontos}`, width/2, height/2 - 30);
    
    const recorde = parseInt(localStorage.getItem("recorde")) || 0;
    text(`Recorde: ${recorde}`, width/2, height/2 + 10);
    
    if (pontos >= recorde && pontos > 0) {
        fill(76, 201, 240);
        text("NOVO RECORDE!", width/2, height/2 + 50);
    }
    
    noLoop();
    document.getElementById("btn-reiniciar").style.display = "block";
}
// Pontuação novo
function mousePressed() {
    if (!jogoIniciado) {
      jogoIniciado = true;
      iniciarTimer();
      return;
    }
  
    if (respostaMostrada) {
      const x = width / 2 - 75;
      const y = 320 + 120 + 20;
      const w = 150;
      const h = 45;
  
      if (mouseInside(x, y, w, h)) {
        proximaPergunta();
      }
    } else if (vidas > 0 && perguntasRespondidas < 8) {
      const btnWidth = 120;
      const spacing = 40;
      const startX = width / 2 - (2 * btnWidth + spacing) / 2;
  
      let respostaSelecionada = null;
  
      if (mouseInside(startX, 220, btnWidth, 50)) {
        respostaSelecionada = "Sim";
      } else if (mouseInside(startX + btnWidth + spacing, 220, btnWidth, 50)) {
        respostaSelecionada = "Não";
      }
  
      if (respostaSelecionada !== null) {
        let timeTaken = millis() - lastAnswerTime;
        lastAnswerTime = millis();
  
        verificarResposta(respostaSelecionada, timeTaken); // Envia tempo junto
      }
    }
  }
///
//Atualização sistemas de Pontuação
function verificarResposta(respostaSelecionada, tempoGasto) {
    respostaMostrada = true;
    perguntasRespondidas++;
  
    const correta = perguntas[perguntaAtual].resposta;
  
    if (respostaSelecionada === correta) {
      acertos++;
  
      //  BUFF POR TEMPO E COMBO
      let timeBonus = constrain(map(tempoGasto, 1000, 5000, 1, 0), 0, 1);
      combo++;
      comboTimer = millis();
  
      let baseScore = 100;
      let comboMultiplier = 1 + (combo * 0.1); // +10% por combo
      let earned = baseScore * timeBonus * comboMultiplier;
      score += floor(earned);  
  
      if (combo > maxcombo) maxcombo = combo;
  
    } else {
      combo = 0;
      vidas--;
    }
  }
///
function proximaPergunta() {
    respostaMostrada = false;
    perguntasRespondidas++;
    
    if (perguntasRespondidas < 8 && vidas > 0) {
        perguntaAtual = perguntasSelecionadas[perguntasRespondidas];
        iniciarTimer();
    }
}

function mouseInside(x, y, w, h) {
    return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}

function iniciarTimer() {
    clearInterval(timer);
    tempoRestante = 10;
    timer = setInterval(() => {
        tempoRestante--;
        if (tempoRestante <= 0) {
            verificarResposta(null);
        }
    }, 1000);
}

function gerarPartida() {
    perguntasSelecionadas = [];
    let porNivel = 2;
    let niveis = ["Fácil", "Normal", "Médio", "Difícil"];
    for (let nivel of niveis) {
        let perguntasNivel = perguntas.filter(p => p.dificuldade === nivel);
        perguntasSelecionadas.push(...shuffle(perguntasNivel).slice(0, porNivel));
    }
    perguntasSelecionadas = shuffle(perguntasSelecionadas);
    perguntaAtual = perguntasSelecionadas[0];
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function gerarPerguntas() {
    perguntas = perguntasGeradas;
}

function reiniciarJogo() {
    pontos = 0;
    vidas = 3;
    perguntasRespondidas = 0;
    respostaMostrada = false;
    jogoIniciado = true;
    gerarPartida();
    loop();
    iniciarTimer();
    document.getElementById("btn-reiniciar").style.display = "none";
}