function toggleOptions() {
	var divMenu = document.getElementById("moreOptions");
	var btn = document.getElementById("togOpt");
	document.getElementById("UsrOptions").reset();
	if (document.getElementById("moreOptions").style.length != 0) {
		divMenu.style.display="";
		btn.value="Less Options";
	} else {
		divMenu.style.display="none";
		btn.value="More Options";
	}
}

function readFilePt2(MastFile,SubMastFile) {
	let bufReader = new FileReader();
	let bufReader2 = new FileReader();
	var MastEncoding = document.getElementById("mastEncoding").value;
	var SubMastEncoding = document.getElementById("subMastEncoding").value;
	//console.log("Master: " + MastEncoding + "    Submaster: " + SubMastEncoding);
	let decoder = new TextDecoder(MastEncoding);
	let decoder2 = new TextDecoder(SubMastEncoding);
	bufReader.readAsArrayBuffer(MastFile);
	bufReader.onload = function() {
		var mastStr = decoder.decode(bufReader.result);
		bufReader2.readAsArrayBuffer(SubMastFile);
		bufReader2.onload = function() {
			var subStr = decoder2.decode(bufReader2.result);
			convertFile(mastStr, subStr);
		};
	};
}

function readFilePt1() {
	var MastFile = document.getElementById("master-file").files[0];
	var SubMastFile = document.getElementById("submaster-file").files[0];
	let binReader = new FileReader();
	let binReader2 = new FileReader();
	if (document.getElementById("autoDetect").checked) {
		binReader.readAsBinaryString(MastFile);
		binReader.onload = function() {
			document.getElementById("mastEncoding").value = jschardet.detect(binReader.result).encoding;
			binReader2.readAsBinaryString(SubMastFile);
			binReader2.onload = function() {document.getElementById("subMastEncoding").value = jschardet.detect(binReader2.result).encoding; readFilePt2(MastFile,SubMastFile);};
		};
	} else {readFilePt2(MastFile,SubMastFile);}
}

function timeConvert(dateStr) {
	var dateAry = dateStr.split(":");
	var TotalTime = 0;
	TotalTime += Number(dateAry[0])*360000;
	TotalTime += Number(dateAry[1])*6000;
	TotalTime += Number(dateAry[2].replace(".",""));
	return TotalTime;
}

function timeShift(dateStr, shift) {
	var dateAryShftd = []
	var TotalTime = timeConvert(dateStr);
	TotalTime += shift;
	dateAryShftd[0] = (Math.floor(TotalTime/360000)).toString();
	dateAryShftd[1] = (Math.floor((TotalTime%360000)/6000)).toString();
	dateAryShftd[2] = (Math.floor(((TotalTime%360000)%6000)/100)).toString();
	dateAryShftd[3] = (Math.floor(((TotalTime%360000)%6000)%100)).toString();
	for (let i = 1; i < 4; i++) { if (dateAryShftd[i].length == 1) { dateAryShftd[i] = "0" + dateAryShftd[i] }; };
	dateStrShftd = dateAryShftd[0] + ":" + dateAryShftd[1] + ":" + dateAryShftd[2] + "." + dateAryShftd[3];
	return dateStrShftd;
}

function convertFile(MastSRT, SubMastSRT) {
	//To Do: Clean this up and fully switch program to use seperate arrays for sub and master instead of one big array
	var StandArray = [];
	var SubMastLines = SubMastSRT.split("\n")
	var MastLines = MastSRT.split("\n");
	for (let i = 0; i < MastLines.length; i++) { MastLines[i] = MastLines[i].replace("\r",""); }
	for (let i = 0; i < SubMastLines.length; i++) { SubMastLines[i] = SubMastLines[i].replace("\r",""); }
	var strPart = false;
	var time = "";
	var lineText = "";
	var newPart = false;
	for (let i = 0; i < MastLines.length; i++) {
		if (/-->/.test(MastLines[i])) {
			time = MastLines[i].split(" --> ");
			time[0] = time[0].replace(",",".").substr(1,10);
			time[1] = time[1].replace(",",".").substr(1,10);
			lineText = "";
			strPart = true;
			i++;
			newPart = true;
		}
		while (strPart && i < MastLines.length) {
			if (MastLines[i] == "" ) { strPart = false; }
			else {
				if (lineText != "") { lineText += "\\n"; }
				lineText += MastLines[i];
				i++;
			}
		}
		if (newPart) {
			subObj = { "start" : time[0], "end" : time[1], "text" : lineText, "level" : "master" };
			StandArray.push(subObj);
		}
		newPart = false;
	}
	MastLen = StandArray.length;
	//Make the above and below for loops into one thing later
	strPart = false;
	time = "";
	lineText = "";
	newPart = false;
	for (let i = 0; i < SubMastLines.length; i++) {
		newPart = false;
		if (/-->/.test(SubMastLines[i])) {
			time = SubMastLines[i].split(" --> ");
			time[0] = time[0].replace(",",".").substr(1,10);
			time[1] = time[1].replace(",",".").substr(1,10);
			lineText = "";
			strPart = true;
			i++;
			newPart = true;
		}
		while (strPart && i < SubMastLines.length) {
			if (SubMastLines[i] == "" ) { strPart = false; }
			else {
				if (lineText != "") { lineText += "\\n"; }
				lineText += SubMastLines[i];
				i++;
			}
		}
		if (newPart) {
			subObj = { "start" : time[0], "end" : time[1], "text" : lineText, "level" : "submaster" };
			StandArray.push(subObj);
		}
	}
	if (document.getElementById("UsrSelfAdj").checked) {
		var shiftAmnt = document.getElementById("usrTimeShift").valueAsNumber;
		for (let i = MastLen; i < StandArray.length; i++) {
			StandArray[i].start = timeShift(StandArray[i].start, shiftAmnt);
			StandArray[i].end = timeShift(StandArray[i].end, shiftAmnt);
		}
	}
	var combinationMode = document.getElementById("UsrAutoAdj");
	if (combinationMode.checked) {
		alignSubs(StandArray, MastLen);
	} else {
		arrayToASS(StandArray);
	}
}

function convertColor(col, opcty = 100) {
	if (opcty > 100) {
		opcty = 100;
	} else if (opcty < 0) {
		opcty = 0;
	}
	opcty = Math.abs(opcty - 100);
	opcty = Math.round(opcty * 2.55);
	opcty = opcty.toString(16);
	if (opcty.length = 1) {
		opcty = "0" + opcty;
	}
	col = "&H" + opcty + col.slice(5) + col.slice(3,5) + col.slice(1,3);
	return col;
}

function alignSubs(StandArray, MasterLeng) {
	var TimeLimit = document.getElementById("TimeDiffMax").valueAsNumber;
	var OnSubLine = 0;
	for (let i = 0; i < MasterLeng; i++) {
		var masterTime = [timeConvert(StandArray[i].start), timeConvert(StandArray[i].end)];
		while (OnSubLine < StandArray.length - MasterLeng) {
			var currentSubLine = OnSubLine + MasterLeng;
			var subTime = [timeConvert(StandArray[currentSubLine].start), timeConvert(StandArray[currentSubLine].end)];
			let difs = [masterTime[0] - subTime[0],masterTime[1] - subTime[1]];
			if ((Math.abs(difs[0])) <= TimeLimit && (Math.abs(difs[1])) <= TimeLimit) {
				StandArray[currentSubLine].start = StandArray[i].start;
				StandArray[currentSubLine].end = StandArray[i].end;
				OnSubLine += 1;
				break;
			} else if (difs[0] < 0 || difs[1] < 0) {
				break;
			} else {
				OnSubLine += 1;
			}
		}
	}
	arrayToASS(StandArray);
}

function arrayToASS(CombinedArray) {
	//Data from options form
	var Ufontsize = document.getElementById("UsrFontsize").value;
	var MasterColors = [convertColor(document.getElementById("UsrMastPrimColor").value),convertColor(document.getElementById("UsrMastOutColor").value,document.getElementById("UsrOutOpacity").value),convertColor(document.getElementById("UsrMastShdwColor").value,document.getElementById("UsrShdwOpacity").value)]
	var SubMasterColors = [convertColor(document.getElementById("UsrSubMastPrimColor").value),convertColor(document.getElementById("UsrSubMastOutColor").value,document.getElementById("UsrOutOpacity").value),convertColor(document.getElementById("UsrSubMastShdwColor").value,document.getElementById("UsrShdwOpacity").value)]
	if (document.getElementsByName("UsrBordStyle")[0].checked) {
		var Uborderstyle = "1";
	} else { var Uborderstyle = "3"; }
	var UoutlineWidth = document.getElementById("UsrOutWidth").value;
	var UshdwSize = document.getElementById("UsrShdwSize").value;
	var UMastLoc = document.getElementById("MastLoc").value;
	var USubMastLoc = document.getElementById("SubMastLoc").value;
	
	var fileContent = "";
	fileContent += "[Script Info]\n; Created at mattrangel.net\nTitle: Subtitles\nScriptType: v4.00+\nCollisions: Normal\nPlayDepth: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
	fileContent += "Style: Default, Arial, " + Ufontsize + ", " + MasterColors[0] + ", &H0300FFFF, " + MasterColors[1] + ", " + MasterColors[2] + ", 0, 0, " + Uborderstyle + ", " + UoutlineWidth + ", " + UshdwSize + ", " + UMastLoc + ", 10, 10, 10, 1\n"
	fileContent += "Style: Secondary, Arial, " + Ufontsize + ", " + SubMasterColors[0] + ", &H0300FFFF, " + SubMasterColors[1] + ", " + SubMasterColors[2] + ", 0, 0, " + Uborderstyle + ", " + UoutlineWidth + ", " + UshdwSize + ", " + USubMastLoc + ", 10, 10, 10, 1\n\n"
	fileContent += "[Events]\nFormat: Layer, Start, End, Style, Actor, MarginL, MarginR, MarginV, Effect, Text\n"
	for (let i = 0; i < CombinedArray.length; i++) {
		var line = CombinedArray[i];
		if (/<.>/.test(line.text)) {
			line.text = line.text.replace("<i>","{\\i1}");
			line.text = line.text.replace("<b>","{\\b1}");
			line.text = line.text.replace("<u>","{\\u1}");
		}
		line.text = line.text.replace(/<.*?>/g,"");
		if (line.level == "master") {
			fileContent += ("Dialogue: 0," + line.start + "," + line.end + ",Default,,0,0,0,," + line.text + "\n");
		} else {
			fileContent += ("Dialogue: 0," + line.start + "," + line.end + ",Secondary,,0,0,0,," + line.text + "\n");
		}
	}
	//console.log(jschardet.detect(fileContent).encoding);
	var dlLink = document.getElementById("dwnld");
	var ASSFile = new Blob([fileContent], {type: "text/plain"});
	window.URL = window.URL || window.webkitURL;
	dlLink.setAttribute("href", window.URL.createObjectURL(ASSFile));
	dlLink.setAttribute("download", "subtitles.ass");
	document.getElementById("dwnld").click();

}


