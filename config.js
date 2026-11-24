/* ==========================================================================
   注音與語文遊樂園｜首頁設定檔
   - 自由練習區（openGames）：免密碼，點選直接開新分頁
   - 語文闖關區（lockedGames）：網址已經加密保存，不含明碼密碼與明碼連結
   - 若要修改共用密碼或更新連結，請在本機開啟「密碼設定工具.html」重新產生本檔
   ========================================================================== */
window.PORTAL_CONFIG = Object.freeze({
  siteTitle: "注音與語文遊樂園",
  siteSubtitle: "挑選喜歡的關卡，一起大聲唸注音、開心收集閃亮星星吧！",
  copyrightText: "© 傑尼爾教育文化事業集團 版權所有",

  // Google 試算表／Apps Script 雲端密碼即時驗證設定
  // 填入部署後的 Web App 網址（結尾為 /exec）後，自動啟用雲端試算表即時驗證；
  // 若留空 ""，則自動使用下方加密金庫進行驗證。
  cloudAuth: {
    apiUrl: "",
    timeoutMs: 12000
  },

  // 本機離線模式使用的密碼位數（雲端模式自動支援 4～8 位任意純數字長度）
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

  // 2. 需要密碼・點選開啟（連結已以 SHA-256 加密封裝）
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
      scrim: "linear-gradient(180deg, rgba(246, 255, 248, 0.25) 0%, rgba(246, 255, 248, 0.1) 60%, rgba(255, 253, 246, 0.35) 100%)",
      vault: { salt: "3c607ef3a81e9a18916dc01f77e8cd0a", rounds: 2000, cipher: "7a7c246ccc48048e26eb6dbc5e025009742285d5680ab882c8ffa101fa418f2d77bb3b8deea55b129db8924638fd74f9d9a831dfb910", mac: "123244eb664dc90d8b1e735ff3d02419aaa4d444f5ddf3a88370776fe697a0cf" }
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
      scrim: "linear-gradient(180deg, rgba(240, 249, 255, 0.24) 0%, rgba(240, 249, 255, 0.08) 60%, rgba(255, 253, 246, 0.35) 100%)",
      vault: { salt: "f5a564bc4f8168030bce8f42dc0f13ed", rounds: 2000, cipher: "44847cebe4607ef62467f01f28822c856178246de9bc2fad7ac39661387f2df8d8d0d8a87f4e62e3b47885ecd254b85fd6f8d6ca8b9da3e694a009b241", mac: "001750dd5b7892e691c1b3daef03f68e611a6ed6a714d96ef8366a0f59a97c90" }
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
      scrim: "linear-gradient(180deg, rgba(255, 248, 236, 0.25) 0%, rgba(255, 248, 236, 0.08) 60%, rgba(255, 253, 246, 0.35) 100%)",
      vault: { salt: "fd3afe276bd39d4c7a6a2697ba3aff61", rounds: 2000, cipher: "51e8550c00d902c7f7f71ddb17afd695c14dcfadd2b47213f1119d50df956305370f8a6c1fc89aac977d069453a1d3c5bb2a71f141e8666bbbb1414b871e1cad1bcebe", mac: "77a1e79a8b7b75a434316d53c9f3a86e63cd47a90a6cd3068754aaf7f9653299" }
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
      scrim: "linear-gradient(180deg, rgba(46, 38, 92, 0.22) 0%, rgba(46, 38, 92, 0.1) 60%, rgba(255, 253, 246, 0.3) 100%)",
      vault: { salt: "272b610af3ae585c3364c1348333acb3", rounds: 2000, cipher: "7d34cf3a9015ecde53877d60b4da1517ab1e7ec4a183e7ce6b0050297957439b708463d1b8286dedbdbb0352ad9cc79be903279b5e77f898730e8a", mac: "2122778eeeb588742a68fad587ce094c7ea751f229d517303a81bf9131dc0fd1" }
    }
  ]
});