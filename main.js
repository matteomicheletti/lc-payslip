/**
 * This file contains the main JavaScript code for the HTML version of the project
 * The project is a simple pay slip generator
 *
 * It takes input values from the user to filter the data and generate a pay slip
 *
 * The inputs are:
 * - Year, an integer number
 * - Month, a string with the month name in the select and the month number in the value
 * - CSV file, a file input to upload the CSV file with the data
 *
 * @autor: Matteo Micheletti
 * @version: 1.0
 * @date: 2024-02-03
 */

// [FIRST PART - Updating Input values to generate pay slip]

// Updating current year

// year is a number input
let yearInput = document.querySelector("#year");

// get current year
let currentYear = new Date().getFullYear();

// set current year as default value
yearInput.value = currentYear;

// Updating current month
let monthSelect = document.querySelector("#month");

// moth is a select input
// get current month
let currentMonth = new Date().getMonth();

// if current month is just one digit, add a 0 before
if (currentMonth < 10) {
  currentMonth = "0" + currentMonth;
}

// set current month as default value
monthSelect.value = currentMonth;

// CSV file input
let csvFileInput = document.querySelector("#csvFile");

// [UTILITIES FUNCTIONS - Functions used in the second part of the code]

/**
 * This function sends a toast message to the user
 * It creates an element with tailwind classes to show the message
 * as a toast message with the specified color
 * @param {string} message - The message to show to the user
 * @param {string} color - The color of the toast message (e.g., "green", "red")
 * @returns {void}
 */
const sendToastMessage = (message, color) => {
  // create a div element
  const div = document.createElement("div");
  // add tailwind classes to the div
  div.classList.add(
    `bg-${color}-100`,
    "border",
    `border-${color}-400`,
    `text-${color}-700`,
    "px-4",
    "py-3",
    "rounded",
    "relative",
    "mb-4",
    "max-w-xl",
    "mx-auto"
  );
  // create a paragraph element
  const p = document.createElement("p");
  // add tailwind classes to the paragraph
  p.classList.add("text-center");
  // add the message to the paragraph
  p.textContent = message;
  // append the paragraph to the div
  div.appendChild(p);
  // append the div to the body
  document.body.insertBefore(div, document.body.firstChild);

  // remove the toast message after 3 seconds
  setTimeout(() => {
    // remove it in a smooth way
    // an animation should be nice to see

    // Gradually make the div transparent and translate it up
    for (let i = 0; i <= 100; i++) {
      setTimeout(() => {
        div.style.opacity = 1 - i / 100;
        div.style.transform = `translateY(-${i}px)`;
      }, i * 10);
    }

    // remove the div after the animation
    setTimeout(() => {
      div.remove();
    }, 1000);
  }, 3000);
};

/**
 * This function sends a success message to the user
 * It calls the sendToastMessage function with the specified message and color
 * @param {string} message - The message to show to the user
 * @returns {void}
 */
const sendSuccessMessage = (message) => {
  sendToastMessage(message, "green");
};

/**
 * This function sends an error message to the user
 * It calls the sendToastMessage function with the specified message and color
 * @param {string} message - The message to show to the user
 * @returns {void}
 */
const sendErrorMessage = (message) => {
  sendToastMessage(message, "red");
};

/**
 * This function makes the code sleep for the specified amount of seconds
 * @param {number} seconds - The amount of seconds to sleep
 * @returns {Promise} A promise that resolves after the specified amount of seconds
 */
const sleep = (seconds) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, parseFloat(seconds) * 1000);
  });
};

// [SECOND PART - Reading CSV file and generating pay slip]

/**
 * This function checks if the data is ok to generate the pay slip
 *
 * Mandatory data:
 * - Year
 * - Month
 * - CSV file
 *
 * @returns {boolean} true if the data is ok, false if not
 */
const isDataOk = () => {
  // Default data
  let answer = true;
  let errors = [];
  // check if year is ok
  if (!yearInput.value) {
    answer = false;
    errors.push("Inserire Anno");
  }

  // check if month is ok
  if (!monthSelect.value) {
    answer = false;
    errors.push("Inserire Mese");
  }

  // check if CSV file is ok
  if (!csvFileInput.files[0]) {
    answer = false;
    errors.push("Inserire File CSV");
  }

  if (!answer) {
    sendErrorMessage(errors.join(", "));
  }

  return answer;
};

/**
 * This function reads the CSV file and returns the data in a synchronous way
 * @returns {Array} The data from the CSV file
 */
const readCSVFile = async () => {
  // create a new FileReader
  const reader = new FileReader();

  // read the file
  reader.readAsText(csvFileInput.files[0]);

  // using tailwind css create a loading spinner
  // with a black overlay on the page
  // to let the user know that the data is being read

  let overlay = document.createElement("div");
  overlay.classList.add(
    "fixed",
    "top-0",
    "left-0",
    "w-full",
    "h-full",
    "bg-black",
    "bg-opacity-50",
    "z-50"
  );
  document.body.appendChild(overlay);

  // add also a spinner and a message "Caricamento in corso..."
  // The spinner must be a tailwind spinner that is animated and so rotates
  // the message must be displayed at the spinner right side
  // so spinner and message must be in a flex container equally spaced and centered
  // message and spinner must be white

  let flexContainer = document.createElement("div");
  flexContainer.classList.add(
    "fixed",
    "top-1/2",
    "left-1/2",
    "transform",
    "-translate-x-1/2",
    "-translate-y-1/2",
    "flex",
    "items-center"
  );
  overlay.appendChild(flexContainer);

  let spinner = document.createElement("div");
  spinner.classList.add(
    "animate-spin",
    "rounded-full",
    "h-32",
    "w-32",
    "border-t-4",
    "border-b-4",
    "border-white"
  );
  flexContainer.appendChild(spinner);

  let message = document.createElement("p");
  message.classList.add("text-2xl", "ml-2", "text-white", "font-bold");
  message.textContent = "Caricamento in corso...";
  flexContainer.appendChild(message);

  // wait 5 seconds and then
  // remove the overlay and return reader.result

  while (!reader.result) {
    await sleep(1);
  }

  /*
  // transform the result in an array of objects
  let data = reader.result.split("\n").map((row) => {
    return row.split(",");
  });

  console.log(data);

  // the first item is the header
  // keys are the header
  let keys = data.shift();

  data = data.map((row) => {
    let obj = {};
    keys.forEach((key, index) => {
      obj[key] = row[index];
    });
    return obj;
  });
  */

  let data = await Papa.parse(reader.result, {
    header: true,
    complete: function (results) {
      console.log(results.data); // This will log the parsed CSV data as an array of objects
    },
  }).data;

  console.log(data);

  // remove the overlay
  overlay.remove();

  /* FILTER DATA */
  // Default filder data
  let checkDate = monthSelect.value + "-" + yearInput.value;
  let newData = [];

  for (const row of data) {
    let giorno_inizio = row["GIORNO INIZIO"];

    if (!giorno_inizio) {
      continue;
    }

    // check using indexOf
    if (giorno_inizio.indexOf(checkDate) === -1) {
      continue;
    }

    newData.push(row);
  }

  // Before return the data, order by "GIORNO INIZIO" descending
  // it's a string in the format "dd-mm-yyyy" so make it as date and order it
  // order first by "NOME DIPENDENTE" then by "GIORNO INIZIO"

  newData = newData.sort((a, b) => {
    let dateA = a["GIORNO INIZIO"].split("-").reverse().join("-");
    let dateB = b["GIORNO INIZIO"].split("-").reverse().join("-");

    if (a["NOME DIPENDENTE"] === b["NOME DIPENDENTE"]) {
      return dateA > dateB ? -1 : 1;
    }

    return a["NOME DIPENDENTE"] > b["NOME DIPENDENTE"] ? 1 : -1;
  });

  // return the data
  return newData;
};

/**
 * This function generates the pay slip and returns the data in a synchronous way
 * @returns {Array} The pay slip data
 */
const generatePaySlips = async () => {
  if (!isDataOk()) {
    return;
  }

  let allLinks = [];

  let searchPaySlipDiv = document.querySelector("#paySlipDiv");
  if (searchPaySlipDiv) {
    searchPaySlipDiv.remove();
  }

  // Read the CSV file and extract necessary information
  let csvData = await readCSVFile();

  csvData = csvData.map((row) => {
    return {
      giorno_inizio: row["GIORNO INIZIO"],
      nome_dipendente: row["NOME DIPENDENTE"],
      tempo_tot_ord: row["TEMPO TOT. ORD"],
      tempo_tot_straord: row["TEMPO TOT. STRAORD."],
      nome_cantiere: row["NOME CANTIERE"],
      note: row["NOTE"],
      min_ord_val: row["MIN. ORD. VAL"] ? parseFloat(row["MIN. ORD. VAL"]) : 0,
      min_straord_val: row["MIN. STRAORD. VAL"]
        ? parseFloat(row["MIN. STRAORD. VAL"])
        : 0,
      km_auto_personale: row["KM Auto Personale"]
        ? parseInt(row["KM Auto Personale"])
        : 0,
      km_auto_aziendale: row["KM Auto Aziendale"]
        ? parseInt(row["KM Auto Aziendale"])
        : 0,
      durc: row["DURC"],
      luogo_destinazione: row["LUOGO DI DESTINAZIONE"],
      poo: row["POO"],
      pos: row["POS"],
      pbp: row["PBP"],
      extra: row["EXTRA"] ? parseFloat(row["EXTRA"]) : 0,
    };
  });

  // group data by employee and then by giorno_inizio
  let groupedData = {};

  for (const row of csvData) {
    if (!groupedData[row.nome_dipendente]) {
      groupedData[row.nome_dipendente] = {};
    }

    if (!groupedData[row.nome_dipendente][row.giorno_inizio]) {
      groupedData[row.nome_dipendente][row.giorno_inizio] = {
        tempo_tot_ord: "",
        tempo_tot_straord: "",
        nome_cantiere: "",
        note: "",
        min_ord_val: 0,
        min_straord_val: 0,
        km_auto_personale: 0,
        km_auto_aziendale: 0,
        durc: "",
        luogo_destinazione: "",
        poo: [],
        pos: [],
        pbp: [],
        extra: 0,
      };
    }

    groupedData[row.nome_dipendente][row.giorno_inizio].tempo_tot_ord +=
      "<br/>" + row.tempo_tot_ord;
    groupedData[row.nome_dipendente][row.giorno_inizio].tempo_tot_straord +=
      "<br/>" + row.tempo_tot_straord;
    groupedData[row.nome_dipendente][row.giorno_inizio].nome_cantiere +=
      "<br/>" + row.nome_cantiere;
    groupedData[row.nome_dipendente][row.giorno_inizio].note +=
      "<br/>" + row.note;
    groupedData[row.nome_dipendente][row.giorno_inizio].min_ord_val +=
      row.min_ord_val;
    groupedData[row.nome_dipendente][row.giorno_inizio].min_straord_val +=
      row.min_straord_val;
    groupedData[row.nome_dipendente][row.giorno_inizio].km_auto_personale +=
      row.km_auto_personale;
    groupedData[row.nome_dipendente][row.giorno_inizio].km_auto_aziendale +=
      row.km_auto_aziendale;
    groupedData[row.nome_dipendente][row.giorno_inizio].durc +=
      "<br/>" + row.durc;
    groupedData[row.nome_dipendente][row.giorno_inizio].luogo_destinazione +=
      "<br/>" + row.luogo_destinazione;
    groupedData[row.nome_dipendente][row.giorno_inizio].poo.push(row.poo);
    groupedData[row.nome_dipendente][row.giorno_inizio].pos.push(row.pos);
    groupedData[row.nome_dipendente][row.giorno_inizio].pbp.push(row.pbp);
    groupedData[row.nome_dipendente][row.giorno_inizio].extra += row.extra;

    // Check if min_ord_val is more than 480
    if (groupedData[row.nome_dipendente][row.giorno_inizio].min_ord_val > 480) {
      let delta =
        groupedData[row.nome_dipendente][row.giorno_inizio].min_ord_val - 480;
      groupedData[row.nome_dipendente][row.giorno_inizio].min_straord_val +=
        delta;
      groupedData[row.nome_dipendente][row.giorno_inizio].min_ord_val = 480;

      // Update also tempo_tot_ord and tempo_tot_straord
      // They're string like 'n ore e m minuti'
      // so we need to parse them and update them

      groupedData[row.nome_dipendente][row.giorno_inizio].tempo_tot_ord =
        "8 ore e 0 minuti";

      let straord = delta / 60;
      let ore = Math.floor(straord);
      let minuti = (straord - ore) * 60;
      minuti = Math.round(minuti);
      if (minuti === 60) {
        ore++;
        minuti = 0;
      }
      if (minuti === 0) {
        minuti = "00";
      }
      groupedData[row.nome_dipendente][row.giorno_inizio].tempo_tot_straord =
        ore + " ore e " + minuti + " minuti";
    }
  }

  // Month italian mapping
  const italian_months = {
    "01": "Gennaio",
    "02": "Febbraio",
    "03": "Marzo",
    "04": "Aprile",
    "05": "Maggio",
    "06": "Giugno",
    "07": "Luglio",
    "08": "Agosto",
    "09": "Settembre",
    10: "Ottobre",
    11: "Novembre",
    12: "Dicembre",
  };

  const html_template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BUSTA PAGA {nome_dipendente} - {mese} {anno}</title>
        <style>
            @media print {
                table {
                    page-break-inside: avoid;
                }
            }
            * {
                font-size: 10px; /* Ridotta la dimensione del carattere per adattarsi alla pagina */
            }
            body {
                font-family: 'Arial', sans-serif;
                margin: 10px; /* Ridotto il margine */
            }
            h1, h2 {
                text-align: center;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px; /* Ridotto il margine superiore */
            }
            th, td {
                border: 1px solid #ddd;
                padding: 6px; /* Ridotto il padding */
                text-align: left;
                font-size: 8px; /* Ridotta la dimensione del carattere */
            }
            th {
                background-color: #f2f2f2;
            }
            p {
                margin-top: 5px; /* Ridotto il margine superiore del paragrafo */
            }
            strong {
                color: #007BFF;
            }
            .summary-table, .riepilogo-table {
                margin-top: 10px;
            }
            .summary-table th, .summary-table td, .riepilogo-table th, .riepilogo-table td {
                border: 1px solid #ddd;
                padding: 6px; /* Ridotto il padding */
                text-align: left;
                font-weight: bold;
                text-transform: uppercase;
            }
            footer {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background-color: #f2f2f2;
                padding: 10px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <h1>BUSTA PAGA</h1>
        <h2>{nome_dipendente} - {mese} {anno}</h2>
        
        <table>
            <tr>
                <th>Giorno</th>
                <!-- <th>POO</th> -->
                <!-- <th>POS</th> -->
                <!-- <th>Minuti Ordinari</th> -->
                <!-- <th>Minuti Straordinari</th> -->
                <th>Tempo Ordinario</th>
                <th>Tempo Straordinario</th>
                <th>Nome Cantiere</th>
                <!-- <th>DURC</th> -->
                <th>Km Auto Pers.</th>
                <th>Km Auto Az.</th>
                <th>Luogo di Destinazione</th>
                <th>Note</th>
                <!-- <th>extra</th> -->
            </tr>
            {table_rows}
        </table>

        <table class="summary-table">
            <tr>
                <td colspan="2"><strong>TOTALE ORE e KM:</strong></td>
            </tr>
            <tr>
                <td><strong>Totale Ore Ordinarie Lavorate:</strong></td>
                <td>{total_ord_hours} ore</td>
            </tr>
            <tr>
                <td><strong>Totale Ore Straordinarie Lavorate:</strong></td>
                <td>{ore_IB} ore</td>
            </tr>
            <tr>
                <td><strong>TOS:</strong></td>
                <td>{total_straord_hours} ore</td>
            </tr>
            <tr>
                <td><strong>Totale KM Percorsi:</strong></td>
                <td>{total_km} km</td>
            </tr>
        </table>

        <table class="riepilogo-table">
            <tr>
                <td colspan="2"><strong>RIEPILOGO IMPORTO:</strong></td>
            </tr>
            <tr>
                <td><strong style="text-color:red;color:red;">Totale da Pagare:</strong></td>
                <td style="text-color:red;color:red;">{totale_da_pagare} Euro</td>
            </tr>
            <!-- <tr>
                <td><strong>POO:</strong></td>
                <td>{poo}</td>
            </tr>
            <tr>
                <td><strong>POS:</strong></td>
                <td>{pos}</td>
            </tr>
            <tr>
                <td><strong>Ore ordinarie:</strong></td>
                <td>{min_ord_val}</td>
            </tr>
            <tr>
                <td><strong>Ore straordinarie:</strong></td>
                <td>{min_straord_val}</td>
            </tr> -->
            <tr>
                <td><strong>PLUS Straordinario:</strong></td>
                <td>{importo_straord} Euro</td>
            </tr>
            <tr>
                <td><strong>RIMBORSO KM:</strong></td>
                <td>{costo_km} Euro</td>
            </tr>
            <tr>
                <td><strong>EXTRA:</strong></td>
                <td>{total_extra} Euro</td>
            </tr>
            <tr>
                <td><strong>PLUS Ordinario:</strong></td>
                <td>{importo_ord} Euro</td>
            </tr>
            <tr>
                <td><strong>Buono Pasto Totale:</strong></td>
                <td>{total_buono_past} Euro</td>
            </tr>
        </table>
    </body>
    </html>
  `;

  let paySlipDiv = document.createElement("div");
  paySlipDiv.classList.add(
    "max-w-md",
    "mx-auto",
    "bg-white",
    "rounded-xl",
    "shadow-md",
    "overflow-hidden",
    "md:max-w-2xl"
  );
  paySlipDiv.id = "paySlipDiv";
  document.body.appendChild(paySlipDiv);

  // Create a title for the pay slips
  let mainTitle = document.createElement("div");
  mainTitle.classList.add(
    "uppercase",
    "tracking-wide",
    "text-sm",
    "text-indigo-500",
    "font-semibold",
    "text-center",
    "mt-4"
  );
  mainTitle.textContent = "Elenco Buste Paga";

  paySlipDiv.appendChild(mainTitle);
  for (const employee in groupedData) {
    let nome_dipendente = employee;
    let tempo_tot_ord = "";
    let tempo_tot_straord = "";
    let nome_cantiere = "";
    let note = "";
    let min_ord_val = 0;
    let min_straord_val = 0;
    let km_auto_personale = 0;
    let km_auto_aziendale = 0;
    let durc = "";
    let luogo_destinazione = "";
    let poo = [];
    let pos = [];
    let pbp = [];
    let extra = 0;
    let table_rows = "";
    let total_buono_past = 0;

    let lastDayVal = {};

    for (const day in groupedData[employee]) {
      tempo_tot_ord += groupedData[employee][day].tempo_tot_ord;
      tempo_tot_straord += groupedData[employee][day].tempo_tot_straord;
      nome_cantiere = groupedData[employee][day].nome_cantiere;
      note = groupedData[employee][day].note;
      min_ord_val += parseFloat(groupedData[employee][day].min_ord_val);
      min_straord_val += parseFloat(groupedData[employee][day].min_straord_val);
      km_auto_personale += parseFloat(
        groupedData[employee][day].km_auto_personale
      );
      km_auto_aziendale += parseFloat(
        groupedData[employee][day].km_auto_aziendale
      );
      durc = groupedData[employee][day].durc;
      luogo_destinazione = groupedData[employee][day].luogo_destinazione;
      poo = parseFloat(groupedData[employee][day].poo[0]);
      pos = parseFloat(groupedData[employee][day].pos[0]);
      pbp = parseFloat(groupedData[employee][day].pbp[0]);
      let current_extra = parseFloat(groupedData[employee][day].extra);
      if (!isNaN(current_extra)) {
        extra += current_extra;
      }

      if (!lastDayVal[employee + day]) {
        lastDayVal[employee + day] = 0;
      }

      lastDayVal[employee + day] +=
        (parseFloat(groupedData[employee][day].min_ord_val) +
          parseFloat(groupedData[employee][day].min_straord_val)) /
        60;
      total_buono_past += lastDayVal[employee + day] >= 6 ? parseInt(pbp) : 0;

      table_rows += `
            <tr>
                <td>${"<br/>" + day}</td>
                <!--<td>${groupedData[employee][day].poo}</td>-->
                <!--<td>${groupedData[employee][day].pos}</td>-->
                <!--<td>${groupedData[employee][day].min_ord_val}</td>-->
                <!--<td>${groupedData[employee][day].min_straord_val}</td>-->
                <td>${groupedData[employee][day].tempo_tot_ord}</td>
                <td>${groupedData[employee][day].tempo_tot_straord}</td>
                <td>${groupedData[employee][day].nome_cantiere}</td>
                <td>${groupedData[employee][day].km_auto_personale}</td>
                <td>${groupedData[employee][day].km_auto_aziendale}</td>
                <!--<td>${groupedData[employee][day].durc}</td>-->
                <td>${groupedData[employee][day].luogo_destinazione}</td>
                <td>${groupedData[employee][day].note}</td>
                <!--<td>${groupedData[employee][day].extra}</td>-->
            </tr>
        `;
    }

    let total_km = km_auto_personale + km_auto_aziendale;
    let importo_ord = (min_ord_val / 60) * parseFloat(poo) || 0;
    let importo_straord = (min_straord_val / 60) * parseFloat(pos) || 0;
    let importo_IB = 0;

    let ore_IB = 0;    
    // update on March 2024
    if (min_straord_val / 60 > 5) {
      ore_staord = Math.round((min_straord_val / 60) * 0.8);
      ore_IB =  Math.round((min_straord_val / 60) * 0.2);
      importo_IB = Math.round(importo_straord * 0.2);
      importo_straord = Math.round(importo_straord * 0.8);
    }

    let costo_km =
      parseFloat(km_auto_personale) * 0.37 -
      parseFloat(km_auto_aziendale) * 0.37;

    let totale_da_pagare =
      importo_ord +
      importo_straord +
      total_buono_past +
      extra +
      costo_km;

      let html = html_template;
      html = html.replace(/{nome_dipendente}/g, nome_dipendente);
      html = html.replace(/{mese}/g, italian_months[monthSelect.value]);
      html = html.replace(/{anno}/g, yearInput.value);
      html = html.replace(/{table_rows}/g, table_rows);
      html = html.replace(/{total_ord_hours}/g, (min_ord_val / 60).toFixed(2));
      html = html.replace(
        /{total_straord_hours}/g,
        (min_straord_val / 60).toFixed(2)
      );
      html = html.replace(/{total_km}/g, parseFloat(total_km).toFixed(2));
      html = html.replace(/{importo_ord}/g, parseFloat(importo_ord).toFixed(2));
      html = html.replace(
        /{importo_straord}/g,
        parseFloat(importo_straord).toFixed(2)
      );

    if (min_straord_val / 60 > 5) {
      html = html.replace(/{ore_IB}/g, parseFloat(ore_IB).toFixed(2));
    } else {
      const regex = /<tr>\s*<td><strong>Totale Ore Ordinarie Lavorate:<\/strong><\/td>\s*<td>{total_ord_hours} ore<\/td>\s*<\/tr>/gm;
      const subst = ``;

      // The substituted value will be contained in the result variable
      const result = html.replace(regex, subst);
    }
    html = html.replace(/{costo_km}/g, parseFloat(costo_km).toFixed(2));
    html = html.replace(
      /{total_buono_past}/g,
      parseFloat(total_buono_past).toFixed(2)
    );
    html = html.replace(/{total_extra}/g, parseFloat(extra).toFixed(2));
    html = html.replace(
      /{totale_da_pagare}/g,
      parseFloat(totale_da_pagare).toFixed(2)
    );

    html = html.replace(/{pos}/g, parseFloat(pos).toFixed(2));
    html = html.replace(/{poo}/g, parseFloat(poo).toFixed(2));
    html = html.replace(
      /{min_ord_val}/g,
      parseFloat(min_ord_val).toFixed(2) / 60
    );
    html = html.replace(
      /{min_straord_val}/g,
      parseFloat(min_straord_val).toFixed(2) / 60
    );

    // Create a button to let user download the pay slip
    let a = document.createElement("a");
    a.href = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    a.htmlTpl = html;
    a.download = `${nome_dipendente}_busta_paga_${
      italian_months[monthSelect.value]
    }_${yearInput.value}.html`;
    a.textContent = `Download BUSTA ${nome_dipendente}`;

    a.classList.add(
      "block",
      "bg-gray-500",
      "hover:bg-gray-700",
      "text-white",
      "font-bold",
      "py-2",
      "px-4",
      "rounded",
      "focus:outline-none",
      "focus:shadow-outline",
      "mt-4",
      "mx-auto",
      "w-1/2"
    );

    allLinks.push(a);

    paySlipDiv.appendChild(a);
  }

  let downloadAllButton = document.createElement("a");
  downloadAllButton.href = "";
  downloadAllButton.id = "downloadAllButton";
  downloadAllButton.textContent = "Download Totale";
  downloadAllButton.classList.add(
    "block",
    "bg-blue-500",
    "hover:bg-blue-700",
    "text-white",
    "font-bold",
    "py-2",
    "px-4",
    "rounded",
    "focus:outline-none",
    "focus:shadow-outline",
    "mt-4",
    "mx-auto",
    "w-1/2"
  );

  paySlipDiv.appendChild(downloadAllButton);

  document
    .querySelector("#downloadAllButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();

      let zip = new JSZip();

      for (const link of allLinks) {
        zip.file(link.download, link.htmlTpl);
      }

      let content = await zip.generateAsync({ type: "blob" });

      const a = document.createElement("a");
      const url = URL.createObjectURL(content);
      a.href = url;
      a.download = `buste_paga_${italian_months[monthSelect.value]}_${
        yearInput.value
      }.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });

  let lastBr = document.createElement("br");
  paySlipDiv.appendChild(lastBr);
};
