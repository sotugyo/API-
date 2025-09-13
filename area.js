document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = "https://docs.google.com/spreadsheets/d/1w5waa7_xUlB-_wt0TfLhDw48ehg86yl6/gviz/tq?sheet=有名&headers=1&tq=";

  let currentLang = 'ja'; // デフォルト日本語

  fetch(sheetURL)
    .then(res => res.text())
    .then(data => {
      const json = JSON.parse(data.substr(47).slice(0, -2));
      const rows = json.table.rows;

      const spots = rows.map(row => ({
        genre: row.c[0]?.v,
        name: {
          ja: row.c[1]?.v,
          en: row.c[2]?.v,
          cn: row.c[3]?.v
        },
        img: row.c[4]?.v     // ここはImgurの直接URL
      }));

      displaySpots(spots, 1);
      displaySpots(spots, 2);

      // 言語切替イベント
      const langButtons = document.querySelectorAll('#language-switcher button');
      langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          currentLang = btn.dataset.lang; // ja, en, cn
          // 固定文言を切替
          document.querySelectorAll('.lang-ja, .lang-en, .lang-cn').forEach(el => {
            el.style.display = 'none';
          });
          document.querySelectorAll(`.lang-${currentLang}`).forEach(el => {
            el.style.display = '';
          });
          // スポット名の言語更新
          updateSpotNames(spots);
        });
      });
    });

  // スポットを表示
  function displaySpots(spots, step) {
    spots.forEach((spot, i) => {
      const containerId = `step${step}-cat-${spot.genre}`;
      const container = document.getElementById(containerId);
      if (!container) return;

      const div = document.createElement('div');
      div.className = 'spot-item';
      div.dataset.index = i; // ← どのスポットか記録
      div.style.cursor = 'pointer';
      div.style.display = 'inline-block';
      div.style.margin = '5px';
      div.style.border = '2px solid transparent';

      div.innerHTML = `
        <img src="${spot.img}" alt="${spot.name.ja}" width="100"><br>
        <p class="spot-name">${spot.name[currentLang]}</p>
      `;

      div.addEventListener('click', () => selectSpot(spot, step, div));
      container.appendChild(div);
    });
  }

  // 言語切替時にスポット名を更新
  function updateSpotNames(spots) {
    document.querySelectorAll('.spot-item').forEach(div => {
      const index = div.dataset.index;
      if (index === undefined) return;
      const spot = spots[index];
      const p = div.querySelector('.spot-name');
      if (p && spot) {
        p.textContent = spot.name[currentLang] || spot.name.ja;
      }
    });
  }

  // スポット選択処理
  function selectSpot(spot, step, div) {
    if (step === 1) {
      localStorage.setItem('step1Spot', JSON.stringify(spot));
      highlightSelected('step1', div);
    } else {
      localStorage.setItem('step2Spot', JSON.stringify(spot));
      highlightSelected('step2', div);
    }
  }

  // 選択中のスポットに枠をつける
  function highlightSelected(step, selectedDiv) {
    document.querySelectorAll(`#${step} .spot-item`).forEach(div => {
      div.style.border = div === selectedDiv ? '2px solid red' : '2px solid transparent';
    });
  }

  // 次のページへ
  const nextBtn = document.getElementById('next-step');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const step1 = localStorage.getItem('step1Spot');
      const step2 = localStorage.getItem('step2Spot');
      if (!step1 || !step2) {
        alert('両方のスポットを選んでください');
        return;
      }
      window.location.href = 'spot.html';
    });
  }
});
