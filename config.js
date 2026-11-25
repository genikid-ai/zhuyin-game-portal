/* ==========================================================================
   注音與語文遊樂園｜首頁設定檔（Google 試算表雲端即時驗證版）
   - 自由練習區（openGames）：免密碼，點選直接開新分頁
   - 語文闖關區（lockedGames）：由 Google 試算表即時驗證密碼並回傳對應網址，
     前端完全不保存密碼或闖關連結；日後改密碼只需修改試算表 B2 儲存格即可全園生效！
   ========================================================================== */
window.PORTAL_CONFIG = Object.freeze({
  siteTitle: "注音與語文遊樂園",
  siteSubtitle: "挑選喜歡的關卡，一起大聲唸注音、開心收集閃亮星星吧！",
  copyrightText: "© 傑尼爾教育文化事業集團 版權所有",

  // Google 試算表／Apps Script 雲端密碼即時驗證端點
  cloudAuth: {
    apiUrl: "https://script.google.com/macros/s/AKfycbzTvCQ_44IlMgfk820PydRlZWvnCCoj0_QFDpyyVAJc5Ba0hrtYz8RsF6IXixAtk20V/exec",
    timeoutMs: 12000
  },

  // 雲端模式自動支援 4～8 位任意純數字密碼
  pinLength: 4,

  // 1. 免密碼・點選即可開啟
  openGames: [
    {
      id: "zhuyin-symbols",
      title: "注音符號",
      subtitle: "森林小動物集星星・大聲唸出注音符號",
      tags: ["ㄅ ～ ㄦ", "37 個注音"],
      url: "https://genikid-ai.github.io/zhuyin-forest-stars/",
      bgImage: "assets/bg-zhuyin.jpg",
      mascotImage: "assets/mascot-zhuyin.png",
      themeClass: "theme-forest",
      borderColor: "#8ed4a5",
      lipColor: "#63b37f",
      ctaBg: "linear-gradient(180deg, #52bc78 0%, #2d8f51 100%)",
      ctaLip: "#1e6639",
      scrim: "linear-gradient(96deg, rgba(255, 253, 245, 0.92) 0%, rgba(242, 252, 244, 0.78) 54%, rgba(242, 252, 244, 0.14) 100%)"
    },
    {
      id: "combined-rhyme",
      title: "結合韻",
      subtitle: "太空星際探險・學習、練習與挑戰三模式",
      tags: ["22 個結合韻", "星球大冒險"],
      url: "https://genikid-ai.github.io/zhuyin-compound-space/",
      bgImage: "assets/bg-rhyme.jpg",
      mascotImage: "assets/mascot-rhyme.png",
      themeClass: "theme-space",
      borderColor: "#9aaef8",
      lipColor: "#677cd9",
      ctaBg: "linear-gradient(180deg, #748ffc 0%, #4c63d2 100%)",
      ctaLip: "#3244a4",
      scrim: "linear-gradient(96deg, rgba(24, 30, 74, 0.84) 0%, rgba(36, 44, 102, 0.66) 56%, rgba(36, 44, 102, 0.14) 100%)"
    }
  ],

  // 2. 需要密碼・點選開啟（由私人 Google 試算表即時驗證並回傳連結）
  lockedGames: [
    {
      id: "middle-upper",
      stage: "中上",
      title: "語詞配對",
      themeLabel: "小兔子陽光草原",
      bgImage: "assets/bg-meadow.jpg",
      mascotImage: "assets/mascot-bunny.png",
      stageColor: "#42a868",
      borderColor: "#9ad8ab",
      lipColor: "#6db583",
      ctaBg: "linear-gradient(180deg, #54bd78 0%, #329456 100%)",
      ctaLip: "#226c3d",
      scrim: "linear-gradient(180deg, rgba(246, 255, 248, 0.25) 0%, rgba(246, 255, 248, 0.1) 60%, rgba(255, 253, 246, 0.35) 100%)"
    },
    {
      id: "middle-lower",
      stage: "中下",
      title: "語詞配對",
      themeLabel: "小熊飛行員雲朵冒險",
      bgImage: "assets/bg-sky.jpg",
      mascotImage: "assets/mascot-bear.png",
      stageColor: "#3b95d9",
      borderColor: "#98ccf2",
      lipColor: "#65a5d6",
      ctaBg: "linear-gradient(180deg, #56aef0 0%, #2f82c4 100%)",
      ctaLip: "#205f91",
      scrim: "linear-gradient(180deg, rgba(240, 249, 255, 0.24) 0%, rgba(240, 249, 255, 0.08) 60%, rgba(255, 253, 246, 0.35) 100%)"
    },
    {
      id: "senior-upper",
      stage: "大上",
      title: "韻詞尋寶",
      themeLabel: "小松鼠陽光藏寶島",
      bgImage: "assets/bg-island.jpg",
      mascotImage: "assets/mascot-squirrel.png",
      stageColor: "#e6842c",
      borderColor: "#f5c284",
      lipColor: "#d9984c",
      ctaBg: "linear-gradient(180deg, #ffae47 0%, #e0761c 100%)",
      ctaLip: "#ab530d",
      scrim: "linear-gradient(180deg, rgba(255, 248, 236, 0.25) 0%, rgba(255, 248, 236, 0.08) 60%, rgba(255, 253, 246, 0.35) 100%)"
    },
    {
      id: "senior-lower",
      stage: "大下",
      title: "文字密碼",
      themeLabel: "小貓頭鷹夢幻星光站",
      bgImage: "assets/bg-starry.jpg",
      mascotImage: "assets/mascot-owl.png",
      stageColor: "#7862d4",
      borderColor: "#c2b5f2",
      lipColor: "#9280d6",
      ctaBg: "linear-gradient(180deg, #917ce8 0%, #644ec2 100%)",
      ctaLip: "#473496",
      scrim: "linear-gradient(180deg, rgba(46, 38, 92, 0.22) 0%, rgba(46, 38, 92, 0.1) 60%, rgba(255, 253, 246, 0.3) 100%)"
    }
  ]
});
