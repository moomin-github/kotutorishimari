// ロード完了時にイベント登録
window.onload = function() {
  //「取締情報取得」ボタン押下時のイベント
  var btn = document.getElementById("getInfoBtn");
  btn.addEventListener("click", getKotuToriInfo);
};

var map;
// マーカーを管理する配列
var arrMarker;

function initMap() {
  // マップの初期化
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    //center: { lat: 33.73, lng: 134.53 } //美波町の緯度経度
    center: { lat: 33.9, lng: 134.446 }
  });

  arrMarker = new google.maps.MVCArray();

  // クリックイベントを追加
  // マップ内クリック時の処理
  map.addListener("click", function(e) {});
}

// 徳島県警察署 交通取締計画情報を取得
// 取得元ページ：https://www.police.pref.tokushima.jp/24kotuanzen/torisimari/kotu-torisimari.html
function getKotuToriInfo() {
  const request = new XMLHttpRequest();
  // GoogleAppsScriptで作成したAPIを利用してデータ取得元ページのテーブル部のHTMLを取得
  const url =
    "https://script.google.com/macros/s/AKfycbwlTZ7LVkw0i4hLVkojgheMU8YES07XL10QBqKnaVzz_PcgBRgp/exec";

  request.open("GET", url);
  request.addEventListener("load", event => {
    // ステータス異常ハンドリング
    if (event.target.status !== 200) {
      console.error(`${event.target.status}: ${event.target.statusText}`);
      return;
    }

    // 取得した情報を表示
    const tbody = document.getElementById("kotuToriTbody");
    tbody.innerHTML = event.target.responseText;

    var arrKotuTori = setArrInfo(tbody);

    // カレンダーから日付を取得
    let cal = document.getElementById("cal").value;
    // YYYY-MM-DDからDDのみ切り出しString型に変換
    let strCalDate = String(parseInt(cal.slice(-2), 10));

    for (let arrCnt = 0; arrCnt < arrKotuTori.length; arrCnt++) {
      let kotuToriObj = arrKotuTori[arrCnt];
      if (kotuToriObj.date === strCalDate) {
        // 路線及び取締内容が空の場合「不明」を代入
        if (!checkStrEmpty(kotuToriObj.route1)) {
          kotuToriObj.route1 = "不明";
        }
        if (!checkStrEmpty(kotuToriObj.content1)) {
          kotuToriObj.content1 = "不明";
        }
        if (!checkStrEmpty(kotuToriObj.route2)) {
          kotuToriObj.route2 = "不明";
        }
        if (!checkStrEmpty(kotuToriObj.content2)) {
          kotuToriObj.content2 = "不明";
        }

        // arrKotuToriのlocationからmapにマーカを設置、
        // contentからマーカーの吹出しに取締計画を表示
        if (checkStrEmpty(kotuToriObj.location1)) {
          setMarker(
            kotuToriObj.ampm,
            kotuToriObj.location1,
            kotuToriObj.route1,
            kotuToriObj.content1
          );
        }
        if (checkStrEmpty(kotuToriObj.location2)) {
          setMarker(
            kotuToriObj.ampm,
            kotuToriObj.location2,
            kotuToriObj.route2,
            kotuToriObj.content2
          );
        }
      }
    }

    // 表示範囲を移動
    // var latLngLiteral = { lat: 33.73, lng: 134.53 };
    // var bounds = new google.maps.LatLngBounds();
    // bounds.extend(latLngLiteral);
    // map.fitBounds(bounds);

    // マップのズームレベルを設定
    //map.setZoom(10);
  });
  //エラーハンドリング
  request.addEventListener("error", () => {
    console.error("Network Error");
  });
  request.send();
}

function setMarker(argAmpm, argLocation, argRoute, argContent) {
  // すでに表示されているマーカーを削除
  arrMarker.forEach(function(marker, idx) {
    marker.setMap(null);
  });

  // ジオコーダのコンストラクタ
  var geocoder = new google.maps.Geocoder();

  // geocode(request, callback)
  //  Parameters:
  //  ・request:  GeocoderRequest
  //  ・callback:  function(Array<GeocoderResult>, GeocoderStatus)
  geocoder.geocode(
    {
      address: "徳島県" + argLocation
    },
    function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        for (var i in results) {
          if (results[i].geometry) {
            // 緯度経度を取得
            var latLng = results[i].geometry.location;

            // マーカーインスタンス
            var marker = new google.maps.Marker({
              position: latLng,
              map: map
            });

            //住所を取得
            var address = results[0].formatted_address.replace(/^日本,/, "");

            new google.maps.InfoWindow({
              content:
                address.slice(6) + //「日本, 徳島県」は切捨て
                "<br>路線：" +
                argRoute +
                "<br>取締内容：" +
                argContent +
                "<br>時間帯：" +
                argAmpm
            }).open(map, marker);
            arrMarker.push(marker);
          }
        }
        //エラーハンドリング
      } else if (status == google.maps.GeocoderStatus.ERROR) {
        alert("サーバとの通信時にエラーが発生");
      } else if (status == google.maps.GeocoderStatus.INVALID_REQUEST) {
        alert("リクエストに問題アリ！geocode()に渡すGeocoderRequestを確認");
      } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
        alert("短時間にクエリを送りすぎ");
      } else if (status == google.maps.GeocoderStatus.REQUEST_DENIED) {
        alert("ジオコーダの利用が許可されていない");
      } else if (status == google.maps.GeocoderStatus.UNKNOWN_ERROR) {
        alert("サーバ側でのトラブル");
      } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
        alert("見つかりません");
      } else {
        alert("その他のエラー");
      }
    }
  );
}

function setArrInfo(tbody) {
  var arr = [];
  // テーブルのデータ（交通取締情報）を格納するオブジェクト
  for (let i = 1; i < tbody.rows.length; i++) {
    var obj = {
      date: "",
      week: "",
      ampm: "",
      location1: "",
      route1: "",
      content1: "",
      location2: "",
      route2: "",
      content2: ""
    };
    // テーブルデータの各行列のデータをオブジェクトに格納
    for (let j = 0; j < tbody.rows[i].cells.length; j++) {
      let cell = tbody.rows[i].cells[j];

      // 日付、曜日が取得が存在する場合取得
      if (j === 0 && cell.innerHTML !== "") {
        var date = cell.innerHTML;
      }
      if (j === 1 && cell.innerHTML !== "") {
        var week = cell.innerHTML;
      }

      switch (j) {
        case 0:
          obj["date"] = date;
          break;
        case 1:
          obj["week"] = week;
          break;
        case 2:
          obj["ampm"] = cell.innerHTML;
          break;
        case 3:
          obj["location1"] = cell.innerHTML;
          break;
        case 4:
          obj["route1"] = cell.innerHTML;
          break;
        case 5:
          obj["content1"] = cell.innerHTML;
          break;
        case 6:
          obj["location2"] = cell.innerHTML;
          break;
        case 7:
          obj["route2"] = cell.innerHTML;
          break;
        case 8:
          obj["content2"] = cell.innerHTML;
          break;
      }
    }
    arr.push(obj);
  }
  return arr;
}

function checkStrEmpty(str) {
  let result = true;
  if (str === "" || str === null || str === undefined) {
    result = false;
  }
  return result;
}
