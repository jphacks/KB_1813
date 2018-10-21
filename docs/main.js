var pos = 0;															//中心
var nodesNum = 1;													//ノード数
var edgeId = 1;														//未割り当てのエッジID
var flag = false;													//強制生成
document.onkeydown = keydown;
function keydown() {
	console.log(event.keyCode);
	if(event.keyCode == 32 ) vr_function();
	else if(event.keyCode == 83 ) flag = true;
}

window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
var recognition = new webkitSpeechRecognition();
recognition.lang = 'ja';
recognition.interimResults = true;
recognition.continuous = true;

var flag_speech = 0;
function vr_function() {
	window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
	var recognition = new webkitSpeechRecognition();
	recognition.lang = 'ja';
	recognition.interimResults = true;
	recognition.continuous = true;

	recognition.onsoundstart = function() {
		document.getElementById("instruction").innerText = "Recognizing...(Press 's' to abort the input )";
	};
	recognition.onnomatch = function() {
		document.getElementById('instruction').innerText = "Try Again...";
	};
	recognition.onerror = function() {
		document.getElementById('instruction').innerText = "Error";
		if(flag_speech == 0)
			vr_function();
	};
	recognition.onsoundend = function() {
		document.getElementById('instruction').innerText= "Stop";
		vr_function();
	};

	recognition.onresult = function(event) {
		var results = event.results;
		console.log(results);

		for (var i = event.resultIndex; i < results.length; i++) {
			console.log(flag);
			if(results[i].isFinal || flag )
			{
				let str = document.getElementById('minutes').value;
				let DD = new Date();
				let H = String(DD.getHours());
				if( H.length == 1 ) H = '0' + H;
				let M = String(DD.getMinutes());
				if( M.length == 1 ) M = '0' + M;
				let S = String(DD.getSeconds());
				if( S.length == 1 ) S = '0' + S;
				document.getElementById('minutes').innerHTML =  '[' + H + ':' + M + ':' + S + '] ' +
				results[i][0].transcript + '\n' + str;
				addNodes(results[i][0].transcript);
				flag = false;
				vr_function();
			}
			else
			{
				document.getElementById('result_text').innerHTML = "[途中経過] " + results[i][0].transcript;
				flag_speech = 1;
			}
		}
	}
	flag_speech = 0;
	document.getElementById("instruction").innerText = "waiting";
	recognition.start();
}
// create an array with nodes
var nodes = new vis.DataSet();

// create an array with edges
var edges = new vis.DataSet();

// create a network
var container = document.getElementById('mynetwork');
var data = {
	nodes: nodes,
	edges: edges
};
var options = {};
var network = new vis.Network(container, data, options);

network.on("click", function(params) {
	//console.log(params);
	//console.log(params.edges);
	if( params.edges.length == 1 && params.nodes.length == 0 ){
		edges.remove({id : params.edges[0] });
	}
	if (params.nodes.length == 1) {
		var nodeId = params.nodes[0];
		var node = nodes.get(nodeId);
		if( nodeId != pos ){
			console.log(node.label + 'がクリックされました');
			if( pos != 0 ){
				nodes.update({id : pos , group : 1 });
			}
			pos = nodeId;
			let array = checkEdgesNum();
			for( let i = 1 ; i <= array.length ; i++ ){
				console.log(i);
				if( i == pos ) continue;
				if( array[i] ){
					edges.add({ id : edgeId , from : pos , to : i });
					edgeId++;
				}
			}
		}
		else{
			nodes.update({ id : pos , group : 1 });
			pos = 0;
		}
	}

	let array = checkEdgesNum();
	console.log(array);
	for( let i = 1 ; i <= nodes.length ; i++ ){
		if( array[i] )
			nodes.update({ id : i , group : 3 });
		else
			nodes.update({ id : i , group : 1});
	}
	if( pos > 0 )
		nodes.update({ id : pos , group : 2 });

	console.log("pos:"+pos+" pos group:"+ nodes );
});

function checkEdgesNum(){
	var array = Array(nodes.length+1);
	array.fill(true);
	for( let i = 1 ; i <= edgeId ; i++ ){
		if( edges._data[i] == undefined )
			continue;
		array[edges._data[i].from] = false;
		array[edges._data[i].to] = false;
	}
	return array;
}


function addNodes(result){
	console.log(result);
	$.ajax({
		type: 'POST',
		url: 'https://labs.goo.ne.jp/api/morph',
		data: {
			app_id: '83f007948398333edcecf4cbd0def815d86463b74dc4cfb0753f39eb74d348e8',
			request_id: 'record001',
			sentence: result,
			info_filter: 'form|pos',
		},
		success: function(json) {
			var words = json['word_list'][0];
			if( words != undefined ){
				console.log(typeof(words));
				console.log(words);

        var res = new Array(0);
        var accept = new Array("名詞", "名詞接尾辞", "冠名詞", "Alphabet", "Kana", "Katakana", "Kanji", "Roman", "Undef");
        for (let i = 0; i < words.length; ++i) {
          for (let j = 0; j < accept.length; ++j) {
            if (words[i][1] == accept[j]) res.push(words[i][0]);
          }
          if (i > 0 && words[i - 1][1] == '冠名詞' && words[i][1] == '名詞') {
            var after = res.pop();
            var before = res.pop();
            var merged = before + after;
            res.push(merged);
          }
          if (i > 0 && words[i - 1][1] == '名詞' && words[i][1] == '名詞接尾辞') {
            var after = res.pop();
            var before = res.pop();
            var merged = before + after;
            res.push(merged);
          }
        }
        var array = res;

        for( let i = 0 ; i < array.length ; i++ ){
          console.log(array[i]);
          if( pos != 0 && nodes._data[pos].label == array[i] ) continue;
          nodes.add({ id : nodesNum , label : array[i] , group : 1});
          if( pos != 0 )
            edges.add({ id : edgeId , from : pos , to : nodesNum });
          edgeId++;
          nodesNum++;
        }
        console.log(nodes);
      }
    }
  });
}
