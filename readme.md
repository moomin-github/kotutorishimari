#交通取締計画

選択した日付の徳島県警察の取締計画を google map 上に表示します。

#取締計画情報元

徳島県警察署　[交通取締計画](https://www.police.pref.tokushima.jp/24kotuanzen/torisimari/kotu-torisimari.html)

#本 web アプリを利用する場合

index.html の script タグの src の"YOUR_API_KEY"に google cloud platform で作成した API キーを入れてください。

google cloud platform で有効にする API

- Geocoding API
- Maps JavaScript API

```
<script
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"
  async
  defer
></script>
```
