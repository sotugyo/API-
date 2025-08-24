// 鎌倉駅の座標
var kamakura = [35.3199, 139.5501];

// 地図を初期化（鎌倉駅を中心、ズーム14）
var map = L.map('map').setView(kamakura, 14);

// OpenStreetMapのタイルを読み込み
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// マーカーを追加
L.marker(kamakura).addTo(map)
  .bindPopup('鎌倉駅')
  .openPopup();



//ここからOpenRouteServiceを利用して地図が表示されるかどうかを試す




const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU4ZjE5YTkzYmJlNTRiYTI5MzgyMWNkNjAyM2M0NzRjIiwiaCI6Im11cm11cjY0In0=";       // Postmanで使ったキーをそのまま
const url = "https://api.openrouteservice.org/v2/directions/foot-walking"; // 徒歩ルートAPI

// ルートの始点と終点
const body = {
  coordinates: [
    [139.5501, 35.3199],  // スタート地点
    [139.5569, 35.3261]   // ゴール地点
  ]
};

// fetch() でAPIにPOSTリクエスト
fetch(url, {
  method: "POST",
  headers: {
    "Authorization": apiKey,       // APIキーをヘッダーに設定
    "Content-Type": "application/json" // JSON形式で送信
  },
  body: JSON.stringify(body) // JSオブジェクトをJSON文字列に変換
})
.then(res => res.json())  // レスポンスをJSONに変換
.then(data => {


  // ========================
  // 3. 取得したgeometryを地図に描画
  // ========================
  const coords = L.Polyline.fromEncoded(data.routes[0].geometry).getLatLngs(); // geometryをPolylineに変換
  L.polyline(coords, { color: 'blue', weight: 4 }).addTo(map);                  // 地図に描画

  // 地図の表示範囲をルート全体に調整
  map.fitBounds(L.polyline(coords).getBounds());

  // distance（距離）とduration（所要時間）をconsoleで確認
  console.log("距離:", data.routes[0].summary.distance, "m");
  console.log("所要時間:", data.routes[0].summary.duration, "秒");

function addCafeMarkers() {
  // 鎌倉駅周辺の例（座標の緯度経度でフィルタ）
  const cafes = [
    { name: "カフェA", lat: 35.321, lng: 139.552 },
    { name: "カフェB", lat: 35.323, lng: 139.555 }
  ];

  cafes.forEach(cafe => {
    L.marker([cafe.lat, cafe.lng]).addTo(map)
      .bindPopup(cafe.name);
  });
}
 addCafeMarkers();

})
.catch(err => console.error(err)); // エラー時に表示



// ---------------------------
// Visual Crossing Weather API
// ---------------------------

// 自分のAPIキーをここに設定
const weatherApiKey = "WSC4DN94NKZB6P468S5S7DSGC";

// 鎌倉駅の天気情報を取得
const lat = 35.3199;
const lon = 139.5501;
const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?unitGroup=metric&key=${weatherApiKey}&contentType=json`;

fetch(weatherUrl)
  .then(res => res.json())
  .then(data => {
    console.log(data); // デバッグ用
    const current = data.currentConditions;
    const weatherDiv = document.getElementById("weather");
    weatherDiv.innerHTML = `
      <strong>鎌倉駅の天気</strong><br>
      天気: ${current.conditions}<br>
      気温: ${current.temp}°C<br>
      湿度: ${current.humidity}%<br>
      風速: ${current.windspeed} km/h
    `;
  })
  .catch(err => console.error(err));
