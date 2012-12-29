
(function() {
	var browserLanguage = function() {
		try {
			return (navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0,2)
		}
		catch(e) {
			return undefined;
		}
	};

	// 言語設定が日本語以外ならば英語ページへ自動遷移する
	var lang = browserLanguage()
	if (lang != "ja" && lang != "ja-jp" && lang != undefined && location.search == "") {
		//var url = location.hostname + "/english.html";
		var url = "/english.html";
		location.href = url;
	}
})();



