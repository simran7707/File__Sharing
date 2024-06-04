(function(){

	const socket = io(); //Constant socket
	let receiverID; //Recipient code

	//The function generates a 9-digit room code with 3 clusters of numbers that are randomized to 999
	function generateID(){
		return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
	}
	
	//Event Listener for click action on create room button.
	document.querySelector("#sender-start-con-btn").addEventListener("click",function(){
		let joinID = generateID();
		document.querySelector("#join-id").innerHTML = `
			<b>Room ID</b>
			<span>${joinID}</span>
		`;
		socket.emit("sender-join", {
			uid:joinID
		});
	});

	//Initialize socket. Enable file sharing interface and disable room join interface
	socket.on("init",function(uid){
		receiverID = uid;
		document.querySelector(".join-screen").classList.remove("active");
		document.querySelector(".fs-screen").classList.add("active");
	});

	//Event Listener for the action of adding files.
	document.querySelector("#file-input").addEventListener("change",function(e){
		let file = e.target.files[0];
		if(!file){
			return;		
		}
		let reader = new FileReader();
		reader.onload = function(e){
			let buffer = new Uint8Array(reader.result);
			let el = document.createElement("div");
			el.classList.add("item");
			el.innerHTML = `
					<div class="progress">0%</div>
					<div class="filename">${file.name}</div>
			`; //inner 1 code to show the progress to the interface (above)

			document.querySelector(".files-list").appendChild(el);
			shareFile({
				filename: file.name,
				total_buffer_size:buffer.length,
				buffer_size:4096,
			}, buffer, el.querySelector(".progress"));
		}
		reader.readAsArrayBuffer(file);
	});

	//Sharefile function - the main character helps to transfer files
	function shareFile(metadata,buffer,progress_node){
		socket.emit("file-meta", {
			uid:receiverID,
			metadata:metadata
		});
		
		socket.on("fs-share",function(){
			let chunk = buffer.slice(0,metadata.buffer_size);
			buffer = buffer.slice(metadata.buffer_size,buffer.length);
			let pr = (((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100));
			progress_node.innerText = pr.toFixed(2) + '%';
			if(chunk.length != 0){
				socket.emit("file-raw", {
					uid:receiverID,
					buffer:chunk
				});
			} else {
				console.log("File sent successfully!");
			}
		});
	}
})();