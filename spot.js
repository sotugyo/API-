document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = "https://docs.google.com/spreadsheets/d/1w5waa7_xUlB-_wt0TfLhDw48ehg86yl6/gviz/tq?sheet=穴場&headers=1&tq=";
  const spotContainer = document.getElementById('spotContainer');
  let currentLang = 'ja';
  const langButtons = document.querySelectorAll('#language-switcher button');

  const userAttributes = JSON.parse(localStorage.getItem('userAttributes') || '{}');
  const step1Spot = JSON.parse(localStorage.getItem('step1Spot') || 'null');
  const step2Spot = JSON.parse(localStorage.getItem('step2Spot') || 'null');

  const genreMap = {
    "歴史・寺社・文化": "History",
    "自然・景観": "Nature",
    "グルメ・カフェ": "Food",
    "お土産・雑貨": "Shopping",
    "体験・アクティビティ": "Activity"
  };
  const selectedGenre = genreMap[userAttributes.interests] || userAttributes.interests;
  const maxDistanceKm = 2;

  function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2)**2 +
      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function pointToLineDistance(lat1, lng1, lat2, lng2, lat0, lng0) {
    const A = getDistance(lat0, lng0, lat1, lng1);
    const B = getDistance(lat0, lng0, lat2, lng2);
    const C = getDistance(lat1, lng1, lat2, lng2);
    if (C === 0) return A;
    const s = (A + B + C) / 2;
    const area = Math.sqrt(s * (s - A) * (s - B) * (s - C));
    return 2 * area / C;
  }

  fetch(sheetURL)
    .then(res => res.text())
    .then(data => {
      const json = JSON.parse(data.substr(47).slice(0, -2));
      const rows = json.table.rows;

      const spots = rows.map(row => ({
        genre: row.c[0]?.v || '',
        name: { ja: row.c[1]?.v || '', en: row.c[2]?.v || '', cn: row.c[3]?.v || '' },
        img: row.c[4]?.v || '',
        description: { ja: row.c[5]?.v || '', en: row.c[6]?.v || '', cn: row.c[7]?.v || '' },
        lat: parseFloat(row.c[8]?.v || 0),  // 9列目
        lng: parseFloat(row.c[9]?.v || 0),
        coolLevel: row.c[9]?.v || '',
        openingHours: row.c[10]?.v || '',
        website: row.c[14]?.v || '',
        reservation: row.c[15]?.v || ''
      }));

      const filteredSpots = spots.filter(s => {
        if (s.genre?.trim().toLowerCase() !== selectedGenre.trim().toLowerCase()) return false;
        if (step1Spot && step2Spot && s.lat && s.lng) {
          const distanceToLine = pointToLineDistance(
            step1Spot.lat, step1Spot.lng,
            step2Spot.lat, step2Spot.lng,
            s.lat, s.lng
          );
          return distanceToLine <= maxDistanceKm;
        }
        return true;
      });

      filteredSpots.forEach((spot, i) => {
        const div = document.createElement('div');
        div.className = 'spot-item';
        div.dataset.index = i;
        div.style.cursor = 'pointer';
        div.style.display = 'inline-block';
        div.style.margin = '5px';
        div.style.border = '2px solid transparent';
        div.style.padding = '5px';

        div.innerHTML = `
          <img src="${spot.img}" alt="${spot.name.ja}" width="100"><br>
          <h3 class="spot-name">${spot.name[currentLang]}</h3>
          <p class="spot-desc">${spot.description[currentLang]}</p>
          <p>
            <strong>
              <span class="lang-ja">営業時間</span>
              <span class="lang-en" style="display:none">Opening Hours</span>
              <span class="lang-cn" style="display:none">营业时间</span>
            </strong>: ${spot.openingHours}
          </p>
          <p>
            <strong>
              <span class="lang-ja">涼しさ</span>
              <span class="lang-en" style="display:none">Coolness</span>
              <span class="lang-cn" style="display:none">凉爽度</span>
            </strong>: ${spot.coolLevel}
          </p>
          <p>
            <a href="${spot.website}" target="_blank">
              <span class="lang-ja">公式サイト</span>
              <span class="lang-en" style="display:none">Website</span>
              <span class="lang-cn" style="display:none">官方网站</span>
            </a>
          </p>
          <p>
            <a href="${spot.reservation}" target="_blank">
              <span class="lang-ja">予約リンク</span>
              <span class="lang-en" style="display:none">Reservation</span>
              <span class="lang-cn" style="display:none">预约链接</span>
            </a>
          </p>
        `;
        div.addEventListener('click', () => selectSpot(spot, div));
        spotContainer.appendChild(div);
      });

      function updateSpotNames() {
        document.querySelectorAll('.spot-item').forEach((div, i) => {
          const spot = filteredSpots[i];
          if (!spot) return;
          div.querySelector('.spot-name').textContent = spot.name[currentLang];
          div.querySelector('.spot-desc').textContent = spot.description[currentLang];
        });
      }

      function selectSpot(spot, div) {
        document.querySelectorAll('.spot-item').forEach(d => d.classList.remove('selected'));
        div.classList.add('selected');
        localStorage.setItem('hiddenSpot', JSON.stringify(spot));
      }

      // 言語切替
      langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          currentLang = btn.dataset.lang;
          document.querySelectorAll('.lang-ja, .lang-en, .lang-cn').forEach(el => el.style.display = 'none');
          document.querySelectorAll(`.lang-${currentLang}`).forEach(el => el.style.display = '');
          updateSpotNames();
        });
      });

      // 次へボタン
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          const selected = localStorage.getItem('hiddenSpot');
          if (!selected) {
            alert('穴場スポットを1つ選んでください');
            return;
          }
          window.location.href = 'final.html';
        });
      }

    })
    .catch(err => {
      console.error("穴場スポット取得失敗:", err);
      spotContainer.innerHTML = "<p>データを読み込めませんでした</p>";
    });
});
