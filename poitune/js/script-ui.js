
// デフォルトオブジェクトにメソッドを追加
addMethod();


var _get; // GETリクエストのパラメータ

$(function() {

	// 初期値を設定
	// UI構成前にすべき値のみここで指定
	setup_initialActive_beforeSetUpUI();

	// UIを構成
	setup_ui();

	// イベントのバインド
	setup_eventBinding();

	// 初期値を設定
	setup_initialActive();

	// GETリクエストのパラメータを取得する
	_get = get_getRequest();
	// パラメータがあったらそれをCanvasに復元する
	if (_get != false) {
		_get = decodeUrlParam(_get);
		restoreCanvasParam(_get);
	}

});



function setup_ui() {

	var setup_scroller = (function() {
		//Get the height of the first item
		$('#mask').css({'height':$('#panel-1').height()});  
		//Calculate the total width - sum of all sub-panels width
		//Width is generated according to the width of #mask * total of sub-panels
		$('#panel').width(parseInt($('#mask').width() * $('#panel div').length));
		//Set the sub-panel width according to the #mask width (width of #mask and sub-panel must be same)
		//$('#panel div').width($('#mask').width());
		// ここを修正した
		// $('#panel div') となっていたため、タブ内の全てのdivに余計に適応されてしまっていた
		$('#panel > div').width($('#mask').width());
		$('#panel > div > div').width($('#mask').width());
		//Get all the links with rel as panel
		$('a[rel=panel]').click(function () {
			//Get the height of the sub-panel
			var panelheight = $($(this).attr('href')).height();
			//Set class for the selected item
			$('a[rel=panel]').removeClass('selected');
			$(this).addClass('selected');
			//Resize the height
			$('#mask').animate({'height':panelheight},{queue:false, duration:500});         
			//Scroll to the correct panel, the panel id is grabbed from the href attribute of the anchor
			$('#mask').scrollTo($(this).attr('href'), 500);     
			//Discard the link default behavior
			return false;
		});
	})();


	var setup_scrollerRadioTab = (function() {
		// ボタン表示にする
		$( "#radio-tab" ).buttonset();
		$( "#radio-tab-1" ).button({ icons: { primary: "ui-icon-gear" } });
		$( "#radio-tab-2" ).button({ icons: { primary: "ui-icon-triangle-1-w" } });
		$( "#radio-tab-3" ).button({ icons: { primary: "ui-icon-triangle-1-e" } });
		$( "#radio-tab-4" ).button({ icons: { primary: "ui-icon-folder-open" } });

		// ボタン用のbindに変更する
		$("#radio-tab a").bind("click", function() {
			if ( $(this).hasClass("ui-state-active") ) {
				return false;
			} else {
				$("#radio-tab a.ui-state-active").removeClass("ui-state-active");
				$(this).addClass("ui-state-active");
			}
		});

		$("#radio-tab a").unbind("mouseleave");
		$("#radio-tab a").bind("mouseleave", function() {
			$(this).removeClass("ui-state-hover");
		});

	})();


	var setup_tab = (function() {
		$( "#tabs-general" ).tabs({ show: {effect: "fade", duration: 500 } });
		$( "#tabs-left" ).tabs({ show: {effect: "fade", duration: 500 } });
		$( "#tabs-right" ).tabs({ show: {effect: "fade", duration: 500 } });
		$( "#tabs-examples" ).tabs({ show: {effect: "fade", duration: 500 } });

		// タブクリック時にパネルの height を調整
		$("#panel ul li a").bind("click", function() {
			var panelHeight = $(this).parents('[id*=panel]').height();
			$("#mask").height(panelHeight);
			//$("#mask").animate({"height": panelHeight}, 50, "easeOutQuint");         
		});
	})();


	// 以下、タブ内の構成

	var setup_slider = function(target, value, min, max, step, logarithm) {
		var input = "#" + target;
		var slider = "#" + target + "-slider";
		var initialVal = value;
		if (logarithm) {
			value = logTablePosition(value, min, max);
		}
		$(slider).slider({
			range : "min",
			value : value,
			min   : min,
			max   : max,
			step  : step,
			slide : function( event, ui ) {
				var value = ui.value;
				if (logarithm) {
					var value = linearValToLogTable(value, min, max);
					//value = Math.round_sf(value, 1);
					value = (Math.round(value * 10) / 10);
				}
				$(input).val( value );
				changeCanvasParam( input.substr(1) );
			}
		});
		$(input).val( initialVal );
	}
	setup_slider("commonParam-fps",                             30,    1, 100,    1);
	setup_slider("commonParam-afterimage",                     0.8,    0,   1, 0.01);
	setup_slider("commonParam-speedRate",                        1,  0.1,  10,  0.1, true);
	setup_slider("commonParam-scale",                            1,  0.1,  10,  0.1, true);
	for (var i=0; i<2; i++) {
		setup_slider("locusParam-"+i+"-object-size-origin",              2,    1,  20,    1);
		setup_slider("locusParam-"+i+"-object-size-hand",                4,    1,  20,    1);
		setup_slider("locusParam-"+i+"-object-size-poi",                10,    1,  20,    1);
		setup_slider("locusParam-"+i+"-rotation-radius-hand",           70,    0, 200,    5);
		setup_slider("locusParam-"+i+"-rotation-radius-poi",            70,    0, 200,    5);
		setup_slider("locusParam-"+i+"-rotation-angularVelocity-hand",   1,  -20,  20,    1);
		setup_slider("locusParam-"+i+"-rotation-angularVelocity-poi",   -3,  -20,  20,    1);
		setup_slider("locusParam-"+i+"-rotation-angle-hand",             0,    0, 360,    5);
		setup_slider("locusParam-"+i+"-rotation-angle-poi",              0,    0, 360,    5);
		setup_slider("locusParam-"+i+"-rotation-coordinates-origin-x",   0, -300, 300,   10);
		setup_slider("locusParam-"+i+"-rotation-coordinates-origin-y",   0, -300, 300,   10);
		setup_slider("locusParam-"+i+"-segment-size-arm",                2,   1,   10,    1);
		setup_slider("locusParam-"+i+"-segment-size-chain",              2,   1,   10,    1);
	}


	var setup_colorpicker = function(farbtastic, colorwell) {
		var f = $.farbtastic(farbtastic);
		var selectedColorwell;
		var duration = 400;
		var easing = "easeOutCubic";
		$(colorwell)
		.each(function () { f.linkTo(this); })
		.focus(function() {
			if ( $(this).hasClass("colorwell-selected") ) {
				return false;
			} else {
				var focusedEle = this;
				//f.linkTo(this);
				// farbtastic ライブラリに変更を加えた。
				// .linkto メソッドの引数を増やし、第二引数にcallback関数を付与できるようにした。
				// 詳しくは farbtastic.mod.js を参照。
				f.linkTo(this, function() {
					var elementId = $(colorwell + ".colorwell-selected").attr("id");
					changeCanvasParam(elementId);
				});
				$(colorwell + ".colorwell-selected").removeClass('colorwell-selected', duration, easing);
				$(focusedEle).addClass("colorwell-selected", duration, easing);
			}
		});
	}
	setup_colorpicker("#colorpicker-general-1", ".colorwell-general-1");
	setup_colorpicker("#colorpicker-left-1", ".colorwell-left-1");
	setup_colorpicker("#colorpicker-left-3", ".colorwell-left-3");
	setup_colorpicker("#colorpicker-right-1", ".colorwell-right-1");
	setup_colorpicker("#colorpicker-right-3", ".colorwell-right-3");


	setup_bootstrapButton();


	var setup_tooltip = (function() {
		// おそらく jQuery UI と Twitter Bootstrap がまたしても干渉してる。
		// オプション指定など、期待通りに動作しない。適用されているCSSも違っている。
		// tooltip ではなく popover の方はもっとひどく、そのままではまともに動作しなかった。
		$("a[rel=tooltip]").tooltip({placement: "right"}).bind("click", function() {
			// クリックした際のhrefに指定したページ遷移を無効にする
			return false;
		});
	})();



	var setup_examplesMenu = (function() {
		$( "#examples-menu" ).menu();
	})();
	
	var setup_tabHeight = (function() {
		// 初期選択されているパネルのheightの設定
		var panelHeight = $("#panel-1").height();
		$("#mask").height(panelHeight);
	})();

}




// jQuery UI と Twitter Bootstrap のトグルボタンやラジオボタンが衝突するため、独自にトグルボタンやラジオボタンを定義。
// Twitter Bootstrap デザインのボタンに、それらの動作を付随させる。
function setup_bootstrapButton() {

	// トグルボタン
	var setup_buttonToggle = function(target, onText, offText) {
		$(target).bind("click", function() {
			if ( $(this).hasClass("active") ) {
				$(this).removeClass("active").html(offText).val(0);
			} else {
				$(this).addClass("active").html(onText).val(1);
			}
			// Canvas パラメータを変更
			var elementId = $(this).attr("id");
			changeCanvasParam(elementId);
		});
	}
	// 基本的なボタントグルの設定
	setup_buttonToggle("button.button-toggle", "ON", "OFF");
	// 例外的なボタントグルの設定
	setup_buttonToggle('#syncLeftRightFlag', '<i class="icon-refresh"></i> Sync L-R ON', '<i class="icon-refresh"></i> Sync L-R OFF');


	// ラジオボタン
	var setup_buttonsetRadio = function(target) {
		$(target).find("button").bind("click", function() {
			if ( $(this).hasClass("active") ) {
				return false;
			} else {
				var clickedEle = this;
				$(target).find("button").each(function() {
					if ( $(this).hasClass("active") ) {
						$(this).removeClass("active");
						return false;
					}
				});
				$(clickedEle).addClass("active");

				// Canvas パラメータを変更
				// 親要素のボタンをグループにしている要素にIDをセットしておき、そこのvalueに値を入れておく
				var clickedVal = $(clickedEle).val();
				var elementId = $(clickedEle).parent().val(clickedVal).attr("id");
				changeCanvasParam(elementId);
			}
		});
	}
	setup_buttonsetRadio(".buttonset-radio");

}



function setup_eventBinding() {

	// inputフォーム変更後、Canvasパラメータを変更
	$(".inputVal").change(function() {
		var elementId = $(this).attr("id");
		changeCanvasParam(elementId);
	});


	// Twitter投稿ボタン
	$("#shareTwitter").bind("click", function() {
		var twitterUrl = "https://twitter.com/?status=";

		// 現在のページのURLを取得
		var protocol = window.location.protocol;
		var hostname = window.location.hostname;
		var pathname = window.location.pathname;
		var thisUrl = protocol + "//" + hostname + pathname;

		// [!] TEST: ローカルファイルだった場合はテスト用URLへ切り替え
		if (protocol == "file:") {
			thisUrl = "http://www.yahoo.co.jp/";
		}

		// CanvasのURLパラメータを構成
		var urlParam = "?";
		urlParam += objToUrlParam(commonParam, "commonParam");
		urlParam += "&" + objToUrlParam(locusParam, "locusParam");

		// パラメータの圧縮
		var compressedParam = (function() {
			// URLパラメータの生成
			var param = "";
			param += objToUrlParam(commonParam, "commonParam");
			param += "&" + objToUrlParam(locusParam, "locusParam");

			// 変換圧縮用のオブジェクトを生成
			var transformObj = createTransformObj();

			// URLパラメータを圧縮
			var compressedParam = compressUrlParam(param, transformObj);
			return compressedParam;
		})();

		var twitterParam = thisUrl + "?" + compressedParam;
		twitterParam = encodeURIComponent(twitterParam)

		// 先に空のウィンドウを開いておく
		var win = window.open();

		var beforeText = "ポイの軌道をシミュレートしたよ！ ";
		var afterText = " - by #Poitune";
		getBitlyUrl(twitterParam, function(shortedUrl) {
			// 非同期処理での callback 関数の中になるので、この中で window.open() はポップアップブロックされて効かない。
			//window.open(shortedUrl);
			var tweetText = encodeURIComponent(beforeText + shortedUrl + afterText);
			win.location.href = twitterUrl + tweetText;
		});
	});


	// Examplesメニュー
	$("#examples-menu > li > a").bind("click", function() {
		// クリックされた場所の名称を取得
		var trickName = $(this).text();
		trickName = trickName.toLowerCase().replace(/\s/g, "_");
		
		var _get = new Object();
		var urlparam;
		var urlParamArray;
		var param = new Object();

		for (var key in trickUrlParam) {

			if (key != trickName) {
				continue;
			}

			// パラメータをCanvasに復元する
			urlParam = trickUrlParam[key];
			urlParamArray = urlParam.substr(1).split("&");
			for (var i=0; i<urlParamArray.length; i++) {
				param = urlParamArray[i].split("=");
				_get[param[0]] = param[1];
			}
			_get = decodeUrlParam(_get);
			restoreCanvasParam(_get);
			return false;
		}
		return false;
	});

}




// Canvasパラメータを変更
function changeCanvasParam(elementId) {
	
	// アクションが行われたエレメントが対象のパラメータを変更
	if ( ! elementId ) {
		return false;
	}
	var obtainedVal = $("#" + elementId).val();
	obtainedVal = numStrToNum(obtainedVal);

	assignValToJsObj(elementId, obtainedVal);


	// syncLeftRightFlag がすでにオンだったとき、変更されたパラメータを他方にもコピーする
	var leftToRightOneCopy = function(elementId) {

		if (syncLeftRightFlag != 1) {
			return false;
		}

		var elementArray = elementId.split("-");
		if (elementArray[0] != "locusParam") {
			return false;
		}

		// 同期のコピー先となるlocusParamの番号を取得
		var anotherLocus = (elementArray[1] == 0) ? 1 : 0;

		// 同期のコピー先となるエレメントのIDを取得
		// JavaScriptでは以下の様な配列の値の変更はできない。
		//elementArray[1] == anotherLocus;
		elementArray.splice(1, 1, anotherLocus);
		var anotherElementId = elementArray.join("-");

		// コピー元となる値を取得
		var obtainedVal = $("#" + elementId).val();
		obtainedVal = numStrToNum(obtainedVal);

		// 初期角度を変更した際は、角度の値を調整する。
		if (elementId.match(/^locusParam-(0|1)-rotation-angle/)) {
			obtainedVal += 180;
			if (obtainedVal > 360) {
				obtainedVal -= 360;
			}
		}

		// パラメータ値の変更を適用
		applyVal(anotherElementId, obtainedVal);

	}
	leftToRightOneCopy(elementId);


	// 角速度または初期角度が変更された場合は計算された角度情報をリセット
	if (elementId.match(/^locusParam-(0|1)-rotation-(angle|angularVelocity)/)) {
		resetAngle();
	}


	// syncLeftRightFlag がオンになったとき、Leftの設定をRightにコピーする
	var leftToRightAllCopy = (function() {
		if (elementId != "syncLeftRightFlag") {
			return false;
		}
		if( $("#syncLeftRightFlag").val() == "0") {
			return false;
		}

		var allTargetId = jsObjToHtmlIdArray(locusParam[0], "locusParam-0");
		for (var i=0; i<allTargetId.length; i++) {
			leftToRightOneCopy(allTargetId[i]);
		}
		// 180度ずらす
		var angle = locusParam[0].rotation.angle.hand + 180;
		if (obtainedVal > 360) {
			obtainedVal -= 360;
		}
		locusParam[1].rotation.angle.hand = locusParam[0].rotation.angle.hand + 180;
		locusParam[1].rotation.angle.poi = locusParam[0].rotation.angle.poi + 180;
		$("#locusParam-1-rotation-angle-hand").val(locusParam[1].rotation.angle.hand);
		$("#locusParam-1-rotation-angle-poi").val(locusParam[1].rotation.angle.poi);

		// 角度情報をリセット
		resetAngle();
	})();



}



function setup_initialActive() {
	// 横スクロールするボタンの初期値
	// ===== 開発中はここは図時変更 =====
	$("#radio-tab-1").addClass("selected ui-state-active").click();
	//$("[href=#tabs-right-1]").click();


	// 両方の軌道
	$("#commonParam-numberOfLocus > button[value=2]").click();
	// グリッドの表示
	//$("#commonParam-glid-showFlag").click();

	for (var i=0; i<2; i++) {
		// 物体-表示
		$("#locusParam-"+i+"-object-showFlag-origin").click();
		$("#locusParam-"+i+"-object-showFlag-hand").click();
		$("#locusParam-"+i+"-object-showFlag-poi").click();
		// 線分-表示
		$("#locusParam-"+i+"-segment-showFlag-arm").click();
		$("#locusParam-"+i+"-segment-showFlag-chain").click();
	}

	// Left-Rightの同期
	// これは他の初期値を設定した後で設定
	$("#syncLeftRightFlag").click();

}

function setup_initialActive_beforeSetUpUI() {
	// カラー
	$("#commonParam-glid-color").val("#333333");
	$("#commonParam-backgroundColor").val("#000000");
	for (var i=0; i<2; i++) {
		$("#locusParam-"+i+"-object-color-origin").val("#ae2929");
		$("#locusParam-"+i+"-object-color-hand").val("#47c33c");
		$("#locusParam-"+i+"-object-color-poi").val("#8767d5");
		$("#locusParam-"+i+"-segment-color-arm").val("#5a66dd");
		$("#locusParam-"+i+"-segment-color-chain").val("#d26567");
	}
}


// =====================================
// Utility Functions
// =====================================




// 数値文字列を数値に変換
function numStrToNum(numStr) {
	return (numStr.match(/^-?\d*\.?\d*$/) == null) ? numStr : Number(numStr);
}


// HTML要素のID名に対応するJavaScriptオブジェクト（連想配列）に、指定した値を代入
// * Examples
// HTML ID : foo-bar-baz
// value   : qux
// substitute value for JavaScript Object : 
//   foo.bar.baz   = qux
//     or
//   foo[bar][baz] = qux
function assignValToJsObj(htmlElementId, value) {
	var elementArray = htmlElementId.split("-");
	var jsObj = window;
	var elementArrayLen = elementArray.length;
	for (var i = 0; i < elementArrayLen - 1; i++) {
		if (i == 0) {
			jsObj = window[ elementArray[i] ];
		} else {
			jsObj = jsObj[ elementArray[i] ];
		}
	}
	// JavaScriptでの擬似可変変数
	// グローバル変数はwindowオブジェクトのプロパティであることを利用
	// 左辺が可変変数になっている。foo[bar] のように連想配列で実現
	jsObj[ elementArray[ elementArrayLen - 1 ] ] = value;
}



// パラメータ値の変更を適用
function applyVal(elementId, obtainedVal) {
	var elementArray = elementId.split("-");

	// HTML要素のID名に対応するJavaScriptオブジェクトに指定した値を代入
	assignValToJsObj(elementId, obtainedVal);

	// htmlのvalue値も同様に変更する
	$("#"+elementId).val(obtainedVal);
	// スライダーinputフォームは以上で十分

	// カラーピッカーinputフォームは背景色も変更
	if (elementArray[3] == "color" || elementArray[2] == "color") {
		$("#"+elementId).css("backgroundColor", obtainedVal);
		// 本当は文字色の変更も必要だが結構面倒。HSLの計算も必要。
		// 重要度は高くないのでひとまずスルー。farbtrasticのオブジェクトを呼び出すか。
	}

	// ボタンはトグル状態も変更
	if (elementArray[3] == "showFlag" || elementArray[2] == "showFlag") {
		if (obtainedVal == 1) {
			$("#"+elementId).addClass("active").text("ON");
		} else {
			$("#"+elementId).removeClass("active").text("OFF");
		}
	}
	// ラジオボタンの状態も変更
	if (elementArray[1] == "numberOfLocus") {
		if (obtainedVal == 2) {
			$("#"+elementId + " > button[value=2]").click();
		} else {
			$("#"+elementId + " > button[value=1]").click();
		}
	}

}




// 線形軸上での値を、対数軸上での値に変換
function linearValToLogTable(linerValue, min, max) {
	// Liner min is equal to log min.
	// Also, Liner max is equal to log max.
	var internalRatio = (linerValue - min) / (max - min);
	var logValue = min * Math.pow(max / min, internalRatio);
	return logValue;
}

// 対数軸上での位置を求める
function logTablePosition(value, min, max) {
	// 内分した時の位置の比率を求める
	var internalRatio = ( Math.log(value) - Math.log(min) ) / (Math.log(max) - Math.log(min) );
	// 位置を求める。（対応するスライダーの線形値）
	var positionVal = (max - min) * internalRatio;
	return positionVal;
}





// デフォルトオブジェクトにメソッドを追加
function addMethod() {

	// 底が 10 の対数の値を得る
	Math.log_10 = function(x) {
		return Math.log(x) / Math.log(10);
	}

	// 有効数字 (Significant Figure) を指定して四捨五入する
	Math.round_sf = function(x, n) {
		// 10進数としたときの x の桁数を求める
		var digitNum = Math.floor( Math.log_10(x) ) + 1;
		// 整数値に四捨五入するため前の、割り算する値を求める
		var divideNum = Math.pow( 10, ( digitNum - n ) );

		// 以下、少し特殊な計算。
		// a * 0.1 などのように、浮動小数点の積を求めようとすると誤差が生じる場合がある。
		// この場合では式の最後の、a * divideNum がそれに相当する。
		// しかしここでは有効数字に丸めなければならない。
		// a * divideNum 計算後の誤差が生じた値を丸めようとしても、その有効数字を考慮して丸めなければならない。
		// これでは問題が再帰してしまい解決しない。
		// そこで divideNum が 1 以下の場合、つまり浮動小数点の場合には、divideNumの積を取るのではなく、その逆数である 1 / divideNum の商を取ることにする。
		// これによって浮動小数点同士の不安定な積を求めなくてもよくなり、正確な値が得られるようになる。
		if (divideNum >= 1) {
			var result = Math.round(x / divideNum) * divideNum;
		} else {
			var result = Math.round(x / divideNum) / (1 / divideNum);
		}
		return result;
	}
}



// JavaScriptオブジェクトから、それに対応するHTMLエレメントのIDの配列を取得する。
// === Examples ===
// var foo = {
//   bar : 1,
//   baz : 2,
//   qux : {
//     quux : 3,
//     quuux : 4
//   }
// };
// console.dir(jsObjToHtmlIdArray(foo, "foo"));
// --- Result ---
// Array[4]
// 0: "foo-bar"
// 1: "foo-baz"
// 2: "foo-qux-quux"
// 3: "foo-qux-quuux"
function jsObjToHtmlIdArray(obj, prefix) {
	var htmlIdArray = new Array();

	var objArray;
	var i;
	for (var key in obj) {
		if (typeof obj[key] == "object") {
			objArray = jsObjToHtmlIdArray(obj[key], prefix + "-" + key);
			for (i=0; i<objArray.length; i++) {
				htmlIdArray.push(objArray[i]);
			}
		} else {
			htmlIdArray.push(prefix + "-" + key);
		}
	}
	return htmlIdArray;
}



// bitly の短縮URLを取得する
function getBitlyUrl(longUrl, callback) {
	// callback関数を指定して、Ajax処理が終わった後にcallback関数に指定した次の処理へ進むようにする。
	var login = "o_4r18mfbml7";
	var apiKey = "R_ff6891bbd1680548359b50e7ce0079f0";
	var bitly = "http://api.bit.ly/";
	//var longUrl = "http://example.com/";
	var url = bitly + "/v3/shorten?login=" + login + "&apiKey=" + apiKey + "&longUrl=" + longUrl;

	var shortedUrl;
	$.getJSON(url + "&callback=?", function (result) {
		var shortedUrl = result.data.url;
		callback(shortedUrl);
	});
}


// 対象オブジェクトからURLパラメータを生成する
function objToUrlParam(obj, prefix) {
	var param = "";
	var paramKey;
	var paramVal;

	for (var key in obj) {
		paramKey = prefix + "-" + key;
		if (typeof obj[key] == "object") {
			param += "&" + objToUrlParam(obj[key], paramKey);
		} else {
			paramVal = obj[key];
			param += "&" + paramKey + "=" + obj[key];
		}
	}
	// 先頭の & を消してから値を返す
	return param.substr(1);
}



// 連番を割り当てる
// クロージャ
var makeSerialNumber = (function() {
	// 連番生成用の値を保持する変数
	var i=0;

	// クロージャ。実行する関数の実体
	return function (obj) {
		// 引数が指定されていなかったときはインクリメント値をキャンセル
		if (obj == undefined) {
			i = 0;
			return false;
		}

		for (var key in obj) {
			if (typeof obj[key] == "object") {
				makeSerialNumber(obj[key]);
			} else {
				obj[key] = i;
				i++;
			}
		}
	};
})();


function getTransformObj(obj, prefix) {
	var transformObj = new Object();

	var obj_in;
	var key_in;
	for (var key in obj) {
		if (typeof obj[key] == "object") {
			obj_in = getTransformObj(obj[key], prefix + "-" + key);
			for (key_in in obj_in) {
				transformObj[key_in] = obj_in[key_in];
			}
		} else {
			transformObj[prefix + "-" + key] = obj[key];
		}
	}
	return transformObj;
}


// パラメータ名を圧縮
// オブジェクト名の名称を連番数字にして短縮する
function compressUrlParam(param, transformObj) {
	for (var key in transformObj) {
		// transformObj[key] は数字のみのため、頭に p を付けてキー名の扱いにする
		param = param.replace(key, "p" + transformObj[key]);
	}
	return param;
}


function createTransformObj() {
	// 変換用のオブジェクトに連番割り当て
	var commonParam_convert = $.extend(true, {}, commonParam);
	var locusParam_convert = $.extend(true, {}, locusParam);
	makeSerialNumber(commonParam_convert);
	makeSerialNumber(locusParam_convert);
	makeSerialNumber();

	// 変換用のオブジェクトを構成
	var transformObj_common = getTransformObj(commonParam_convert, "commonParam");
	var transformObj_locus = getTransformObj(locusParam_convert, "locusParam");
	// オブジェクトを結合
	var transformObj = $.extend(transformObj_common, transformObj_locus);
	return transformObj;
}



// GETリクエストのパラメータを取得する
function get_getRequest() {
	var thisUrl = location.href;
	var urlParam = thisUrl.match(/\?.+$/);
	
	// URLにクエリーがなかったらここで終了
	if (urlParam == null) {
		return false;
	}

	var _get = new Object();
	var urlParamArray = urlParam[0].substr(1).split("&");
	var param;
	for (var i=0; i<urlParamArray.length; i++) {
		param = urlParamArray[i].split("=");
		_get[param[0]] = param[1];
	}

	return _get;
}


// パラメータを元の表示名に戻す
function decodeUrlParam(_get) {
	// 変換圧縮用のオブジェクトを生成
	var transformObj = createTransformObj();

	// 変換用の連番数字の一致をチェックして元の表示名に置き換え
	for (var key_get in _get) {
		for (var key_transformObj in transformObj) {
			if (key_get == "p" + transformObj[key_transformObj]) {
				_get[key_transformObj] = _get[key_get];
				delete _get[key_get];
				break;
			}
		}
	}

	return _get;
}


// URLパラメータからCanvasに復元する
function restoreCanvasParam(_get) {
	var elementId;
	var obtainedVal;
	for (var key in _get) {
		elementId = key;
		obtainedVal = numStrToNum(_get[key]);
		applyVal(elementId, obtainedVal);
	}
	resetAngle();
	canvasAfterimageResetFlag = 1;
}


// 角度情報をリセット
function resetAngle() {
	for (var i=0; i<2; i++) {
		hand_angle_hold[i] = locusParam[i].rotation.angle.hand;
		poi_angle_hold[i] = locusParam[i].rotation.angle.poi;
	}
}



