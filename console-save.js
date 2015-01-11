(function(console){

    console.save = function(data, filename, filetype){

        if(!data) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            //data = JSON.stringify(data, undefined, 4)	//the last number specifies how many spaces to add for an indent
		//alert(0);
			var tempdata = JSON.stringify(data, undefined);	
		   data = tempdata;//JSON.stringify(data, undefined);	
		//alert(1);
			tempdata = data.replace(/ /g, '');
			data = tempdata;
		//alert(2);
        }
        
		
		if(filetype=="image/png"){
			var binary = atob(data.split(',')[1]);
			var array = [];
			for(var i = 0; i < binary.length; i++) {
				array.push(binary.charCodeAt(i));
			}
			data = new Uint8Array(array);
		}
		
		var blob = new Blob([data], {type: filetype}),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a')

		
        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = [filetype, a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
		
    }
})(console)


function saveBlob(data, filename, filetype)
{
	var textToWrite = data;
	var textFileAsBlob = new Blob([textToWrite], {type:filetype});
	var fileNameToSaveAs = filename;
	
	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		
		downloadLink.onclick = destroyClickedElement;
		
		downloadLink.style.display = "none";
		
		document.body.appendChild(downloadLink);
		
	}

	downloadLink.click();
	
}

function destroyClickedElement(event)
{
	document.body.removeChild(event.target);
}