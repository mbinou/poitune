// キャンバス
var canvas;
var ctx; // キャンバスコンテキスト
var cW; // キャンバスwidth
var cH; // キャンバスheight

var syncLeftRightFlag; // Left - Right の同期

var angularVelocityRatio = 1 / 5; // 角速度を抑えるための補正

var hand_angle_hold = new Array(2); // 計算の際に保持され続ける角度情報
var poi_angle_hold = new Array(2);

var canvasAfterimageResetFlag;

// 共通設定
var commonParam = {
	fps             : 30,
	afterimage      : 0.8,
	numberOfLocus   : 2,
	speedRate       : 1,
	scale           : 1,
	backgroundColor : "#000000",
	glid            : {
		showFlag : 0,
		color    : "#333333",
		size     : {
			small  : 0.2,
			medium : 0.5,
			large  : 1
		}
	}
};

// 個別の軌道設定
var locusParam = new Array(2);
locusParam[0] = {
	object  : { // 物体設定
		showFlag : {
			origin : 1,
			hand   : 1,
			poi    : 1
		},
		color    : {
			origin : "#ae2929",
			hand   : "#47c33c",
			poi    : "#8767d5"
		},
		size     : {
			origin : 2,
			hand   : 4,
			poi    : 10
		}
	},
	rotation : { // 回転設定
		radius           : {
			hand : 70,
			poi  : 70
		},
		angle            : {
			hand : 0,
			poi  : 0
		},
		angularVelocity  : {
			hand : 1,
			poi  : - 3
		},
		coordinates      : {
			origin : {
				x : 0,
				y : 0
			}
		}
	},
	segment  : { // 線分設定
		showFlag : {
			arm   : 1,
			chain : 1
		},
		color    : {
			arm   : "#5a66dd",
			chain : "#d26567"
		},
		size     : {
			arm   : 2,
			chain : 2
		}
	}
};

// オブジェクトのディープコピー
locusParam[1] = $.extend(true, {}, locusParam[0]);

locusParam[1].rotation.angle = {
	hand : 180,
	poi  : 180
};


// FPSの計算
var Fps = function (targetFps) {
	this.targetFps   = targetFps;        // 目標FPS
	this.interval    = 1000 / targetFps; // ループ処理のインターバル
	this.minInterval = 5;                // 最小インターバル
	this.checkpoint  = new Date();       // 計算のために時間を保持する変数
	this.fps         = 0;
};
Fps.prototype = {

	// checkからcheckまでの時間を元にFPSを計算
	check: function() {
		var now = new Date();
		this.fps = 1000 / (now - this.checkpoint);
		this.checkpoint = new Date();
	},

	// 現在のFPSを取得
	getFps: function() {
		return this.fps.toFixed(0);
	},

	// FPSの値をセット
	setFps: function(targetFps) {
		this.targetFps = targetFps;
		this.interval = 1000 / targetFps;
		return false;
	},


	// 次回処理までのインターバルを取得
	getInterval: function() {
		// ループ処理の内部でかかった時間
		var elapsed = new Date() - this.checkpoint;
		// setTimeout に与えるべき間隔
		var intervalForSetTimout = this.interval - elapsed;
		return intervalForSetTimout > this.minInterval ? intervalForSetTimout : this.minInterval;
	}

};



window.onload = function() {
	init();
};
function init() {
	canvas = document.getElementById('canvas');
	if ( ! canvas || ! canvas.getContext ) return false;
	ctx = canvas.getContext('2d');

	cW = canvas.width;
	cH = canvas.height;

	// 初期角度をセット
	for (var i=0; i<2; i++) {
		hand_angle_hold[i] = locusParam[i].rotation.angle.hand;
		poi_angle_hold[i] = locusParam[i].rotation.angle.poi;
	}

	/*
	// Statsの初期化
	// 実際のFPSの測定
	var stats = new Stats();
	stats.domElement.style.position = "fixed";
	stats.domElement.style.right    = "5px";
	stats.domElement.style.top      = "50px";
	document.body.appendChild(stats.domElement);
	*/

	// アニメーション処理
	var fps = new Fps(commonParam.fps);
	var animation = function() {
		fps.check();
		fps.setFps(commonParam.fps);

		// 残像クリア
		if (canvasAfterimageResetFlag == 1) {
			canvasAfterimageReset();
			canvasAfterimageResetFlag = 0;
		}

		// 次のフレームの描画
		clearCanvas();
		if (commonParam.glid.showFlag) {
			drawGlid();
		}
		drawFrame();

		// ローカルファイルで実行されている場合は実測FPS値を表示
		if (location.protocol == "file:") {
			checkFps(fps);
		}

		setTimeout(animation, fps.getInterval());
	}
	animation();
}


function checkFps(fps) {
	ctx.beginPath();
	ctx.fillStyle = "#ffffff";
	ctx.font = "17px 'メイリオ'";
	ctx.fillText('FPS : ' + fps.getFps(), 10, 20);
}


function clearCanvas() {
	ctx.beginPath();
	ctx.globalAlpha = 1 - commonParam.afterimage; // alpha指定のため、1-x にする
	ctx.fillStyle = commonParam.backgroundColor;
	ctx.fillRect(0, 0, cW, cH);
	ctx.globalAlpha = 1;
}

// 残像値を変更したとき変更前の描画が残り続けるため、それをリセットする関数
function canvasAfterimageReset() {
	ctx.beginPath();
	ctx.globalAlpha = 1;
	ctx.fillStyle = commonParam.backgroundColor;
	ctx.fillRect(0, 0, cW, cH);
	ctx.globalAlpha = 1;
}


function drawGlid() {
	var smallLine  = commonParam.glid.size.small;
	var mediumLine = commonParam.glid.size.mediumLine;
	var largeLine  = commonParam.glid.size.largeLine;

	ctx.strokeStyle = commonParam.glid.color;
	ctx.lineWidth = smallLine;

	// 線の太さを得る
	var getLineWidth = function(i) {
		if (i % 10 == 0) {
			return largeLine;
		} else if (i % 10 == 5) {
			return mediumLine;
		} else {
			return smallLine;
		}
	}

	// 横線
	var horizontalGlid = function(sign) {
		for (var i = 0; i <= cH / 20; i++) {
			ctx.beginPath();
			ctx.lineWidth = getLineWidth(i);

			// キャンバスの中心にグリッドの中心を合わせる
			if (sign == "positiveAxis") {
				ctx.moveTo(0, 10 * i + cH / 2);
				ctx.lineTo(cW, 10 * i + cH / 2);
			} else if (sign == "negativeAxis") {
				ctx.moveTo(0, - 10 * i + cH / 2);
				ctx.lineTo(cW, - 10 * i + cH / 2);
			}

			ctx.closePath();
			ctx.stroke();
		}
	}
	horizontalGlid("positiveAxis");
	horizontalGlid("negativeAxis");

	// 縦線
	var virticalGlid = function(sign) {
		for (var i = 0; i <= cW / 20; i++) {
			ctx.beginPath();
			ctx.lineWidth = getLineWidth(i);

			// キャンバスの中心にグリッドの太い線の交点を合わせる
			if (sign == "positiveAxis") {
				ctx.moveTo(10 * i + cW / 2, 0);
				ctx.lineTo(10 * i + cW / 2, cH);
			} else if (sign == "negativeAxis") {
				ctx.moveTo(- 10 * i + cW / 2, 0);
				ctx.lineTo(- 10 * i + cW / 2, cH);
			}

			ctx.closePath();
			ctx.stroke();
		}
	}
	virticalGlid("positiveAxis");
	virticalGlid("negativeAxis");
}


function drawFrame() {
	// それぞれの軌道を求める
	for (var i = 0; i < 2; i++) {
		// 座標を計算
		var drawObj = getDrawObj(i);

		// 座標の計算は両方とも行い、片方のみか両方表示するかはここで判断
		if (i == 1 && commonParam.numberOfLocus != 2) {
			continue;
		}

		// 描画
		for (var j in drawObj) {
			if (drawObj[j].showFlag == 0) {
				continue;
			}
			ctx.beginPath();
			if (j <= 2) { // origin, hand, poi
				ctx.arc(drawObj[j].x, drawObj[j].y, drawObj[j].size, 0, Math.PI*2, false);
				ctx.fillStyle = drawObj[j].color;
				ctx.fill();
			} else { // arm, chain
				ctx.moveTo(drawObj[j].x_start, drawObj[j].y_start);
				ctx.lineTo(drawObj[j].x_end, drawObj[j].y_end);
				ctx.lineWidth = drawObj[j].size;
				ctx.strokeStyle = drawObj[j].color;
				ctx.stroke();
			}
		}
	}
}


function getDrawObj(i) {
	var interval = 1000 / commonParam.fps;

	var origin_x;
	var origin_y;
	var hand_r;
	var hand_angle;
	var hand_x;
	var hand_y;
	var poi_r;
	var poi_x;
	var poi_y;

	// locusParamからプロパティを取り出して簡潔な変数に入れつつ計算
	origin_x = locusParam[i].rotation.coordinates.origin.x + cW / 2;
	origin_y = locusParam[i].rotation.coordinates.origin.y + cH / 2;
	hand_r = locusParam[i].rotation.radius.hand * commonParam.scale;
	poi_r = locusParam[i].rotation.radius.poi * commonParam.scale;

	// 360度以上の角度の場合に角度を調整する関数
	var adjustAngle = function(angle) {
		while (angle >= 360) {
			angle -= 360;
		}
		return angle;
	}

	// hand_angle の計算
	hand_angle = hand_angle_hold[i];
	hand_angle += locusParam[i].rotation.angularVelocity.hand * angularVelocityRatio * commonParam.speedRate * interval; 
	hand_angle = adjustAngle(hand_angle);
	// 次の角度計算のために角度を保持している変数に代入
	hand_angle_hold[i] = hand_angle;

	// poi_angle の計算
	poi_angle = poi_angle_hold[i];
	poi_angle += locusParam[i].rotation.angularVelocity.poi * angularVelocityRatio * commonParam.speedRate * interval; 
	poi_angle = adjustAngle(poi_angle);
	// 次の角度計算のために角度を保持している変数に代入
	poi_angle_hold[i] = poi_angle;

	// 直行座標を求める
	hand_x = origin_x + hand_r * Math.cos(hand_angle * Math.PI / 180);
	hand_y = origin_y + hand_r * Math.sin(hand_angle * Math.PI / 180);
	poi_x = hand_x + poi_r * Math.cos(poi_angle * Math.PI / 180);
	poi_y = hand_y + poi_r * Math.sin(poi_angle * Math.PI / 180);

	// 描画するためのパラメータをオブジェクトにまとめて返す
	return {
		0 : { // origin
			x        : origin_x,
			y        : origin_y,
			size     : locusParam[i].object.size.origin,
			color    : locusParam[i].object.color.origin,
			showFlag : locusParam[i].object.showFlag.origin
		},
		1 : { // hand
			x        : hand_x,
			y        : hand_y,
			size     : locusParam[i].object.size.hand,
			color    : locusParam[i].object.color.hand,
			showFlag : locusParam[i].object.showFlag.hand
		},
		2 : { // poi
			x        : poi_x,
			y        : poi_y,
			size     : locusParam[i].object.size.poi,
			color    : locusParam[i].object.color.poi,
			showFlag : locusParam[i].object.showFlag.poi
		},
		3 : { // arm
			x_start  : origin_x,
			y_start  : origin_y,
			x_end    : hand_x,
			y_end    : hand_y,
			size     : locusParam[i].segment.size.arm,
			color    : locusParam[i].segment.color.arm,
			showFlag : locusParam[i].segment.showFlag.arm
		},
		4 : { // chain
			x_start  : hand_x,
			y_start  : hand_y,
			x_end    : poi_x,
			y_end    : poi_y,
			size     : locusParam[i].segment.size.chain,
			color    : locusParam[i].segment.color.chain,
			showFlag : locusParam[i].segment.showFlag.chain
		}
	};
}






