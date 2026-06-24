let chart;

const cores = [
  "#2ca02c",
  "#ff8c00",
  "#e31a1c",
  "#7b3fb3",
  "#00bcd4",
  "#795548",
  "#607d8b"
];

function adicionarSeguradora(){
  const div = document.createElement("div");
  div.className = "seg";
  div.innerHTML = `
    <input class="nome" placeholder="Seguradora">
    <input class="qtd" type="number" placeholder="Atendimentos">
    <input class="fat" type="number" placeholder="Faturado">
  `;
  document.getElementById("seguradoras").appendChild(div);
}

function adicionarPrestador(){
  const container = document.getElementById("prestadoresContainer");
  const input = document.createElement("input");
  input.className = "prestador-input";
  input.placeholder = "Colaborador em destaque";
  container.appendChild(input);
}

adicionarSeguradora();
adicionarPrestador();

function formatarDataHora(dataString) {
  if (!dataString) return "";
  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} às ${hora}h${min}`;
}

function gerarRelatorio(){
  const linhas = document.querySelectorAll(".seg");
  let dados = [];
  let totalServ = 0;
  let totalFat = 0;

  linhas.forEach(l => {
    const nome = l.querySelector(".nome").value.toUpperCase();
    const qtd = parseInt(l.querySelector(".qtd").value) || 0;
    const fat = parseFloat(l.querySelector(".fat").value) || 0;

    if (nome) {
      dados.push({ nome, qtd, fat });
      totalServ += qtd;
      totalFat += fat;
    }
  });

  dados.sort((a, b) => b.qtd - a.qtd);

  document.getElementById("tbodyClientes").innerHTML = "";
  dados.forEach((d, index) => {
    const percentual = totalServ > 0 ? ((d.qtd / totalServ) * 100).toFixed(0) : 0;
    const corCirculo = cores[index % cores.length];
    
    document.getElementById("tbodyClientes").innerHTML += `
      <tr>
        <td style="text-align: left; color: #0a2d72;">
          <span class="indicador-cor" style="background-color: ${corCirculo}"></span>
          ${d.nome}
        </td>
        <td style="text-align: left; color: #0a2d72;">${String(d.qtd).padStart(2, '0')}</td>
        <td style="text-align: right; color: ${d.fat > 0 ? '#2ca02c' : '#b33f3f'}">
          R$ ${d.fat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  });

  const prestadoresInputs = document.querySelectorAll(".prestador-input");
  let listaPrestadores = [];
  prestadoresInputs.forEach(input => {
    if(input.value.trim() !== "") {
      listaPrestadores.push(input.value.trim());
    }
  });
  
  const campoListaRelatorio = document.getElementById("rPrestadoresLista");
  if(listaPrestadores.length > 0) {
    campoListaRelatorio.innerHTML = listaPrestadores.map(colaborador => `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; display: inline-block; vertical-align: middle;">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>${colaborador}</span>
      </div>
    `).join("");
  } else {
    campoListaRelatorio.innerText = "-";
  }

  const inicio = document.getElementById("inicio").value;
  const fim = document.getElementById("fim").value;
  if (inicio && fim) {
    document.getElementById("rPeriodo").innerHTML = `${formatarDataHora(inicio)}<br>até ${formatarDataHora(fim)}`;
  } else {
    document.getElementById("rPeriodo").innerText = "-";
  }

  document.getElementById("rResponsavel").innerText = document.getElementById("responsavel").value;
  document.getElementById("rTmc").innerText = document.getElementById("tmc").value ? document.getElementById("tmc").value : "-";
  document.getElementById("rServicos").innerText = String(totalServ).padStart(2, '0');
  document.getElementById("rTotalEixoX").innerText = String(totalServ).padStart(2, '0');
  document.getElementById("rFaturado").innerText = "R$ " + totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById("rJustificativa").innerText = document.getElementById("justificativa").value;
  document.getElementById("rPendencias").innerText = document.getElementById("pendencias").value;

  if (chart) chart.destroy();

  chart = new Chart(
    document.getElementById("grafico"),
    {
      type: 'bar',
      data: {
        labels: dados.map(x => x.nome),
        datasets: [{
          data: dados.map(x => x.qtd),
          backgroundColor: cores,
          barThickness: 32
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            right: 80 
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: dados.length > 0 ? Math.ceil(dados[0].qtd * 1.35) : 10, 
            ticks: { stepSize: 1, color: '#000', font: { weight: 'bold' } },
            grid: { borderDash: [5, 5] }
          },
          y: {
            ticks: { color: '#0a2d72', font: { size: 14, weight: 'bold' } },
            grid: { display: false }
          }
        },
        animation: {
          onComplete: function() {
            const chartInstance = this;
            const ctx = chartInstance.ctx;
            ctx.font = Chart.helpers.fontString(18, 'bold', 'Arial');
            ctx.textBaseline = 'middle';

            chartInstance.data.datasets.forEach((dataset, i) => {
              const meta = chartInstance.getDatasetMeta(i);
              meta.data.forEach((bar, index) => {
                const dataVal = dataset.data[index];
                const perc = totalServ > 0 ? ((dataVal / totalServ) * 100).toFixed(0) : 0;
                const textoExibido = `  ${dataVal}  (${perc}%)`;
                ctx.fillStyle = cores[index % cores.length];
                ctx.fillText(textoExibido, bar.x, bar.y);
              });
            });
          }
        }
      }
    }
  );
}

function baixarPNG(){
  const elementoRelatorio = document.getElementById("relatorio");

  // Guarda responsive original
  const originalResponsive = chart.options.responsive;
  const originalMaintainAspectRatio = chart.options.maintainAspectRatio;

  chart.options.responsive = false;
  chart.options.maintainAspectRatio = true;
  chart.update('none');

  // ✅ CORREÇÃO DO ESPAÇO EM BRANCO:
  // Calcula a altura real do último elemento filho visível dentro do relatório,
  // ignorando padding/min-height inflados pelo flexbox.
  const filhos = Array.from(elementoRelatorio.children).filter(el => el.offsetHeight > 0);
  const ultimo = filhos[filhos.length - 1];
  const relatorioRect = elementoRelatorio.getBoundingClientRect();
  const ultimoRect = ultimo.getBoundingClientRect();

  // Altura real = distância do topo do relatório até o fundo do último filho + padding inferior
  const paddingBottom = parseInt(getComputedStyle(elementoRelatorio).paddingBottom) || 0;
  const alturaReal = (ultimoRect.bottom - relatorioRect.top) + paddingBottom;

  html2canvas(elementoRelatorio, { 
    scale: 2, 
    useCORS: true, 
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    x: 0,
    y: 0,
    // ✅ Usa a altura real calculada em vez de getBoundingClientRect().height
    height: alturaReal,
    windowHeight: alturaReal
  }).then(canvas => {
    chart.options.responsive = originalResponsive;
    chart.options.maintainAspectRatio = originalMaintainAspectRatio;
    chart.update('none');

    // ✅ Corta o canvas para remover qualquer pixel branco extra no fundo
    const alturaFinal = Math.round(alturaReal * 2); // scale: 2
    const canvasCortado = document.createElement("canvas");
    canvasCortado.width = canvas.width;
    canvasCortado.height = Math.min(alturaFinal, canvas.height);
    const ctx = canvasCortado.getContext("2d");
    ctx.drawImage(canvas, 0, 0, canvasCortado.width, canvasCortado.height, 0, 0, canvasCortado.width, canvasCortado.height);

    const link = document.createElement("a");
    link.download = "relatorio-brasil-guinchos.png";
    link.href = canvasCortado.toDataURL("image/png");
    link.click();
  });
}
