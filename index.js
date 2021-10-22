let file;
let df = null; 
let currentIndex = -1; 

function handleFiles(files) {
    
    const fileList = document.getElementById("file_upload");

    if (!files.length) {
        fileList.textContent = "No files selected! \n Please select a .csv-file";
        return;
    } 
    
    file = document.getElementById('file_upload').files[0];
    processFile();
}

function processFile() {

    let fileReader = new FileReader();

    fileReader.readAsText(file);
    fileReader.onload = function () {

        let label = document.getElementById("file_label");
        label.style.display = "none";
        let csv = this.result; 
        let cells = Papa.parse(csv).data // Papaparse provides better parsing of characters in enclosed quotes

        // let lines = csv.split("\n");
        // let cells = []; 

        // for (let line of lines) {
        //     let entries = line.split("\",\"").map((string) => string.replace("\"", "")); 
        //     cells.push(entries);
        // }

        // Inserts dummy cell into the data frame to deal with start and end
        let header = cells[0].clone();
        let dummyLineStart = cells[0].clone();
        let dummyLineEnd = cells[0].clone();

        dummyLineStart[0] = "<Marks the start of a conversation>"
        dummyLineEnd[0] = "<Marks the end of a conversation>"

        cells = cells.slice(1); 
        cells.unshift(dummyLineStart, dummyLineStart);
        cells.push(dummyLineEnd, dummyLineEnd); 

        df = new DataFrame(cells, header);

        showNextMessage();

        document.querySelectorAll(".button").forEach((button) => {
            button.style.display = "block";
        });
    }
}

function labelAs1() {
    label(1);
}

function labelAs0() {
    label(0);
}

function label(label) {

    if (df == null) {
        console.log("You first have to upload a csv file to annotate!"); 
        return; 
    }

    df.setEntry("label", currentIndex + 2, "" + label); 
    console.log(df.getEntry("message", currentIndex + 2) + " was labeled " + label);
    showNextMessage();    
}

function showNextMessage() {
    currentIndex = currentIndex >= df.getRows() - 3 ? 0 : currentIndex + 1;
    showMessages(currentIndex);
}

function showPreviousMessage() {
    currentIndex = currentIndex <= 0 ? df.getRows() - 3 : currentIndex - 1; 
    showMessages(currentIndex);
}

function showMessage(parent, message, original_author, author, timestamp, index) {
    
    clearElement(parent);
    setParagraph(parent, "message_p_" + index, "message_paragraph", message);
    setParagraph(parent, "timestamp_p_" + index, "timestamp_paragraph", author + " - " + timestamp);

    if (original_author == "True") {
        parent.classList.add("first");
        parent.classList.remove("second"); 

    } else {

        parent.classList.add("second");
        parent.classList.remove("first"); 
    }

    parent.style.display = "block";
}

function showMessages(index) {

    for (let i = 1; i <= 3; i++) {
        let parent = document.getElementById("message_" + i);
        let message = df.getEntry("message", index - 1 + i); 
        let original_author = df.getEntry("original_author", index - 1 + i);
        let author = df.getEntry("author", index - 1 + i);
        let timestamp = df.getEntry("time_stamp", index - 1 + i);
        
        showMessage(parent, message, original_author, author, timestamp, i);
    }
}

function printProgress() {
    let rows = df.getRows();
    console.log("The current progress of labelling the chats is:\n");
    console.log("Message: " + currentIndex + " of " + rows);
    console.log("Percent: " + (currentIndex / rows) * 100 + "%\n");
}

function download() {

    if (df == null) {
        console.log("You first have to upload a csv file to annotate!"); 
        return; 
    }

    df.export("csv");
}

class DataFrame {
    constructor(cells, headers) {
        this.cells = cells;
        this.headers = headers;
        this.columnToIndex = {};
        this.indexToColumn = {};

        headers.forEach((header, index) => {
            this.columnToIndex[header] = index; 
            this.indexToColumn[index] = header;
        });

        console.log(this)
    }

    getRows() {
        return this.cells.length; 
    }

    getColumns() {
        return this.cells[0].length; 
    }

    getRow(index) {
        return cells[index]; 
    }

    getColumn(index) {

        let columnIndex = typeof index === "string" ? this.getIndex(index) : index;
        let column = [];

        this.cells.forEach((row, index) => {
            let entry = row[columnIndex];
            column.push(entry);
        });

        return column;
    }

    getEntry(column, index) {
        let columnIndex = typeof column === "string" ? this.getIndex(column) : column;
        return this.cells[index][columnIndex];
    }

    setEntry(column, index, value) {
        let columnIndex = typeof column === "string" ? this.getIndex(column) : column;
        this.cells[index][columnIndex] = value;
    }

    getIndex(columnName) {
        return this.columnToIndex[columnName]; 
    }

    getColumnName(index) {
        return this.indexToColumn[index]; 
    }

    export(fileType) {

        switch (fileType) {
            case "csv":
                // Improved parsing to csv
                let csv = Papa.unparse({
                        "fields": this.headers, 
                        "data": this.cells
                    }
                )

                // let cells = this.cells.map((row) => row.map((entry) => "\"" + entry + "\""));
                // cells.splice(0, 0, this.headers.map((header) => "\"" + header + "\""));

                // let csv = "";

                // cells.forEach((row) => {
                //     let rowString = row.join(",");
                //     csv = csv + "\n" + rowString; 
                // });

                var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});

                var link = document.createElement('a');
                link.style.display = "none";
                link.href = window.URL.createObjectURL(csvData);
                link.setAttribute('download', "labeled_data");
                document.body.appendChild(link);    
                link.click();
                document.body.removeChild(link); 
                break;
        }
    }
}

// Adds key event for faster labeling
document.addEventListener('keydown', (event) => {
    var name = event.key;

    switch (name) {
        case "j":
            labelAs1();
            break;

        case "f":
            labelAs0();
            break;

        case "p":
            printProgress();
            break;

        case "b":
            showPreviousMessage();
            break;
    }
  }, false);


Array.prototype.clone = function() {
    let clone = [].concat(this);
    return clone;
}