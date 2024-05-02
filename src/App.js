import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { PieChart } from "@mui/x-charts/PieChart";
import CanvasJSReact from "@canvasjs/react-charts";
import moment from "moment";

var CanvasJSChart = CanvasJSReact.CanvasJSChart;

function App() {
  // onchange states
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);

  // submit state
  const [excelData, setExcelData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [stepChartData, setStepChartData] = useState([]);
  const [stepChartData1, setStepChartData1] = useState([]);
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("23:59:59");
  const [totalTimeByStage1, setTotalTimeByStage1] = useState({});
  const [sleepLatency, setSleepLatency] = useState(null);
  const [sleepLatencyR, setSleepLatencyR] = useState(null);
  const [formattedTRT, setFormattedTRT] = useState(null);
  const [waso, setWASO] = useState(null);

  const handleStartTimeChange = (event) => {
    setStartTime(event.target.value);
  };

  const handleEndTimeChange = (event) => {
    setEndTime(event.target.value);
  };

  const handleTimeChange = () => {
    const filteredChartData = stepChartData.filter((data) => {
      const time = data.x.toTimeString().slice(0, 8);
      return time >= startTime && time <= endTime;
    });
    const filteredAllData = allData.filter((data) => {
      const time = new Date(data[1]).toTimeString().slice(0, 8);
      return time >= startTime && time <= endTime;
    });
    setStepChartData1(filteredChartData);
    setAllData(filteredAllData);
  };

  const options = {
    animationEnabled: true,
    exportEnabled: true,
    title: {
      text: "Step chart",
    },
    axisY: {
      title: "Sleep stage",
      includeZero: true,
      labelFormatter: function (e) {
        if (e.value === 5) {
          return "W";
        } else if (e.value === 4) {
          return "R";
        } else if (e.value === 3) {
          return "N3";
        } else if (e.value === 2) {
          return "N4";
        } else if (e.value === 1) {
          return "N1";
        }
      },
      gridThickness: 0,
    },
    data: [
      {
        type: "stepLine",
        dataPoints: stepChartData1,
      },
    ],
  };

  // onchange event
  const handleFile = (e) => {
    let fileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    let selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile && fileTypes.includes(selectedFile.type)) {
        setTypeError(null);
        let reader = new FileReader();
        reader.readAsArrayBuffer(selectedFile);
        reader.onload = (e) => {
          setExcelFile(e.target.result);
        };
      } else {
        setTypeError("Please select only excel file types");
        setExcelFile(null);
      }
    } else {
      console.log("Please select your file");
    }
  };

  // submit event
  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (excelFile !== null) {
      const workbook = XLSX.read(excelFile, { type: "buffer" });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
      });
      const data1 = data.slice(2, -1).map((row) => {
        const timeString = row[1]; // Value in column 2
        const time = moment(timeString, "h:mm:ss A"); // Convert to a time object
        return [...row.slice(0, 1), time, ...row.slice(2, 7)]; // Replace column 2 with the time object
      });
      setExcelData(data1);
      setAllData(data1);

      const data2 = data1.map((row) => row[1]);

      const data3 = data1.map((row) => row[3]);
      const data4 = data3.map((value) => {
        if (value === " Sleep stage W") {
          return 5;
        } else if (value === " Sleep stage R") {
          return 4;
        } else if (value === " Sleep stage 3") {
          return 1;
        } else if (value === " Sleep stage 2") {
          return 2;
        } else if (value === " Sleep stage 1") {
          return 1;
        } else {
          return 0;
        }
      });

      const data6 = [];
      for (let i = 0; i < data2.length; i++) {
        const x = new Date(data2[i]);
        const y = data4[i];
        data6.push({ x, y });
      }

      setStepChartData(data6);
      setStepChartData1(data6);

      setStartTime(data6[0].x.toTimeString().slice(0, 8));
      setEndTime(data6[data6.length - 1].x.toTimeString().slice(0, 8));
      // Find the first occurrence of Sleep stage N1
      const sleepStageN1Data = data1.find(
        (data) => data[3] === " Sleep stage 1"
      );

      const sleepStageRData = data1.find(
        (data) => data[3] === " Sleep stage R"
      );

      const sleepStageWData = data1.find(
        (data) => data[3] === " Sleep stage W"
      );

      if (sleepStageN1Data && startTime !== undefined) {
        const sleepTime = moment(
          new Date(sleepStageN1Data[1]).toTimeString().slice(0, 8),
          "HH:mm:ss"
        );
        const startTimeObj = moment(startTime, "HH:mm:ss");

        const duration = moment.duration(sleepTime.diff(startTimeObj));
        const sleepLatency = duration.asSeconds();

        setSleepLatency(sleepLatency);
      }

      if (sleepStageN1Data && sleepStageRData) {
        const sleepTimeN1 = moment(
          new Date(sleepStageN1Data[1]).toTimeString().slice(0, 8),
          "HH:mm:ss"
        );
        const sleepTimeR = moment(sleepStageRData[1], "HH:mm:ss");

        const duration = moment.duration(sleepTimeR.diff(sleepTimeN1));
        const stageRLatency = duration.asSeconds();

        const formattedStageRLatency = moment
          .utc(stageRLatency * 1000)
          .format("HH:mm:ss");

        setSleepLatencyR(formattedStageRLatency);
      }

      if (startTime && endTime) {
        const lightOn = moment(startTime, "HH:mm:ss");
        const lightOff = moment(endTime, "HH:mm:ss");

        const duration = moment.duration(lightOff.diff(lightOn));
        const trt = duration.asSeconds();

        const formattedTRT = moment.utc(trt * 1000).format("HH:mm:ss");
        setFormattedTRT(formattedTRT);
      }

      if (sleepStageN1Data && sleepStageWData) {
        const sleepTimeN1 = moment(
          new Date(sleepStageN1Data[1]).toTimeString().slice(0, 8),
          "HH:mm:ss"
        );
        const sleepTimeW = moment(sleepStageWData[1], "HH:mm:ss");

        const duration = moment.duration(sleepTimeW.diff(sleepTimeN1));
        const waso = duration.asSeconds();

        const formattedWASO = moment.utc(waso * 1000).format("HH:mm:ss");

        setWASO(formattedWASO);
      }

      const column4Data = data3;
      const countMap = new Map();
      column4Data.forEach((item) => {
        countMap.set(item, (countMap.get(item) || 0) + 1);
      });

      const pieChartData = Array.from(countMap.entries()).map(
        ([label, value]) => ({
          id: label,
          value,
          label: label,
        })
      );

      const totalTimeByStage = {};

      allData.forEach((data) => {
        const stage = data[3];
        const duration = parseFloat(data[4]);
  
        if (totalTimeByStage.hasOwnProperty(stage)) {
          totalTimeByStage[stage] += duration;
        } else {
          totalTimeByStage[stage] = duration;
        }
      });
  
      setTotalTimeByStage1(totalTimeByStage);

      setPieChartData(pieChartData);
      const data10 = Object.entries(totalTimeByStage).map(([label, value]) => ({
        id: label,
        value,
        label,
      }));
      
      setPieChartData(data10);
    }
  };
  useEffect(() => {
    const totalTimeByStage = {};
    allData.forEach((data) => {
      const stage = data[3];
      const duration = parseFloat(data[4]);

      if (totalTimeByStage.hasOwnProperty(stage)) {
        totalTimeByStage[stage] += duration;
      } else {
        totalTimeByStage[stage] = duration;
      }
    });

    setTotalTimeByStage1(totalTimeByStage);

    const data10 = Object.entries(totalTimeByStage).map(([label, value]) => ({
      id: label,
      value,
      label,
    }));
    
    setPieChartData(data10);
    
    // Find the first occurrence of Sleep stage N1
    const sleepStageN1Data = allData.find(
      (data) => data[3] === " Sleep stage 1"
    );

    const sleepStageRData = allData.find(
      (data) => data[3] === " Sleep stage R"
    );

    const sleepStageWData = allData.find(
      (data) => data[3] === " Sleep stage W"
    );

    if (sleepStageN1Data && startTime !== undefined) {
      const sleepTime = moment(
        new Date(sleepStageN1Data[1]).toTimeString().slice(0, 8),
        "HH:mm:ss"
      );
      const startTimeObj = moment(startTime, "HH:mm:ss");

      const duration = moment.duration(sleepTime.diff(startTimeObj));
      const sleepLatency = duration.asSeconds();

      const formattedStageRLatency = moment
        .utc(sleepLatency * 1000)
        .format("HH:mm:ss");

      setSleepLatency(formattedStageRLatency);
    }

    if (sleepStageN1Data && sleepStageRData) {
      const sleepTimeN1 = moment(
        new Date(sleepStageN1Data[1]).toTimeString().slice(0, 8),
        "HH:mm:ss"
      );
      const sleepTimeR = moment(sleepStageRData[1], "HH:mm:ss");

      const duration = moment.duration(sleepTimeR.diff(sleepTimeN1));
      const stageRLatency = duration.asSeconds();

      const formattedStageRLatency = moment
        .utc(stageRLatency * 1000)
        .format("HH:mm:ss");

      setSleepLatencyR(formattedStageRLatency);
    }

    if (startTime && endTime) {
      const lightOn = moment(startTime, "HH:mm:ss");
      const lightOff = moment(endTime, "HH:mm:ss");

      const duration = moment.duration(lightOff.diff(lightOn));
      const trt = duration.asSeconds();

      const formattedTRT = moment.utc(trt * 1000).format("HH:mm:ss");
      setFormattedTRT(formattedTRT);
    }

    if (sleepStageN1Data && sleepStageWData) {
      const sleepTimeN1 = moment(
        new Date(sleepStageN1Data[1]).toTimeString().slice(0, 8),
        "HH:mm:ss"
      );
      const sleepTimeW = moment(sleepStageWData[1], "HH:mm:ss");

      const duration = moment.duration(sleepTimeW.diff(sleepTimeN1));
      const waso = duration.asSeconds();

      const formattedWASO = moment.utc(waso * 1000).format("HH:mm:ss");

      setWASO(formattedWASO);
    }
  }, [allData]);
  return (
    <div className="wrapper">
      <h3>Upload & View Excel Sheets</h3>

      {/* form */}
      <form className="form-group custom-form" onSubmit={handleFileSubmit}>
        <input
          type="file"
          className="form-control"
          required
          onChange={handleFile}
        />
        <button type="submit" className="btn btn-success btn-md">
          UPLOAD
        </button>
        {typeError && (
          <div className="alert alert-danger" role="alert">
            {typeError}
          </div>
        )}
      </form>

      {/* view data */}

      {excelData ? (
        <div>
          <h5>1. Light off: {startTime}</h5>
          <h5>2. Light on: {endTime}</h5>
          <div>
            <h5>3. Time in each stage: </h5>
            <p>Sleep stage W: {totalTimeByStage1[" Sleep stage W"]}</p>
            <p>Sleep stage R: {totalTimeByStage1[" Sleep stage R"]}</p>
            <p>Sleep stage N3: {totalTimeByStage1[" Sleep stage 3"]}</p>
            <p>Sleep stage N2: {totalTimeByStage1[" Sleep stage 2"]}</p>
            <p>Sleep stage N1: {totalTimeByStage1[" Sleep stage 1"]}</p>
            <p>
              Sleep cycle:{" "}
              {totalTimeByStage1[" Sleep stage W"] +
                totalTimeByStage1[" Sleep stage R"] +
                totalTimeByStage1[" Sleep stage 3"] +
                totalTimeByStage1[" Sleep stage 2"] +
                totalTimeByStage1[" Sleep stage 1"]}
            </p>
            <h5>4. Percentage of time in each stage:</h5>
            <p>
              Sleep stage W:{" "}
              {(totalTimeByStage1[" Sleep stage W"] /
                (totalTimeByStage1[" Sleep stage W"] +
                  totalTimeByStage1[" Sleep stage R"] +
                  totalTimeByStage1[" Sleep stage 3"] +
                  totalTimeByStage1[" Sleep stage 2"] +
                  totalTimeByStage1[" Sleep stage 1"])) *
                100} %
            </p>
            <p>
              Sleep stage R:{" "}
              {(totalTimeByStage1[" Sleep stage R"] /
                (totalTimeByStage1[" Sleep stage W"] +
                  totalTimeByStage1[" Sleep stage R"] +
                  totalTimeByStage1[" Sleep stage 3"] +
                  totalTimeByStage1[" Sleep stage 2"] +
                  totalTimeByStage1[" Sleep stage 1"])) *
                100} %
            </p>
            <p>
              Sleep stage N3:{" "}
              {(totalTimeByStage1[" Sleep stage 3"] /
                (totalTimeByStage1[" Sleep stage W"] +
                  totalTimeByStage1[" Sleep stage R"] +
                  totalTimeByStage1[" Sleep stage 3"] +
                  totalTimeByStage1[" Sleep stage 2"] +
                  totalTimeByStage1[" Sleep stage 1"])) *
                100} %
            </p>
            <p>
              Sleep stage N2:{" "}
              {(totalTimeByStage1[" Sleep stage 2"] /
                (totalTimeByStage1[" Sleep stage W"] +
                  totalTimeByStage1[" Sleep stage R"] +
                  totalTimeByStage1[" Sleep stage 3"] +
                  totalTimeByStage1[" Sleep stage 2"] +
                  totalTimeByStage1[" Sleep stage 1"])) *
                100} %
            </p>
            <p>
              Sleep stage N1:{" "}
              {(totalTimeByStage1[" Sleep stage 1"] /
                (totalTimeByStage1[" Sleep stage W"] +
                  totalTimeByStage1[" Sleep stage R"] +
                  totalTimeByStage1[" Sleep stage 3"] +
                  totalTimeByStage1[" Sleep stage 2"] +
                  totalTimeByStage1[" Sleep stage 1"])) *
                100} %
            </p>
            <h5>5. Sleep latency: {sleepLatency}</h5>
            <h5>6. Stage R latency: {sleepLatencyR}</h5>
            <h5>
              
              7. Total sleep time (TST):{" "}
              {moment
                .utc(
                  (totalTimeByStage1[" Sleep stage R"] +
                    totalTimeByStage1[" Sleep stage 3"] +
                    totalTimeByStage1[" Sleep stage 2"] +
                    totalTimeByStage1[" Sleep stage 1"]) *
                    1000
                )
                .format("HH:mm:ss")}
            </h5>
            <h5>8. otal recording time (TRT): {formattedTRT}</h5>
            <h5>9. Wake after sleep onset (WASO): {waso}</h5>
            <h5>
              10. Percent sleep efficiency:{" "}
              {((totalTimeByStage1[" Sleep stage R"] +
                totalTimeByStage1[" Sleep stage 3"] +
                totalTimeByStage1[" Sleep stage 2"] +
                totalTimeByStage1[" Sleep stage 1"]) *
                100) /
                moment.duration(formattedTRT).asSeconds()} %
            </h5>
          </div>
        </div>
      ) : null}

      {excelData ? (
        <div className="chart-options  justify-content-center">
          <div className="row">
            <div className="col-md-5">
              <div className="input-group mb-3">
                <span className="input-group-text">Start Time</span>
                <input
                  type="time"
                  className="form-control pt-2"
                  defaultValue={stepChartData[0].x.toTimeString().slice(0, 8)}
                  onChange={handleStartTimeChange}
                />
              </div>
            </div>
            <div className="col-md-5">
              <div className="input-group mb-3">
                <span className="input-group-text">End Time</span>
                <input
                  type="time"
                  className="form-control pt-2"
                  defaultValue={stepChartData[stepChartData.length - 1].x
                    .toTimeString()
                    .slice(0, 8)}
                  onChange={handleEndTimeChange}
                />
              </div>
            </div>
            <div className="col-md-2">
              <div className="input-group">
                <button
                  type="submit"
                  className="btn btn-info"
                  onClick={handleTimeChange}
                >
                  Change time
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {excelData ? (
        <CanvasJSChart
          options={options}
          /* onRef={ref => this.chart = ref} */
        />
      ) : null}

      {excelData ? (
        <PieChart
          series={[
            {
              data: pieChartData,
            },
          ]}
          width={500}
          height={200}
        />
      ) : null}
      <div className="viewer">
        {excelData ? (
          <div className="table-responsive">
            {/* <table className="table">
              <thead>
                <tr>
                  {Object.keys(excelData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {excelData.map((individualExcelData, index) => (
                  <tr key={index}>
                    {Object.keys(individualExcelData).map((key) => (
                      <td key={key}>{individualExcelData[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table> */}
          </div>
        ) : (
          <div>No File is uploaded yet!</div>
        )}
      </div>
    </div>
  );
}

export default App;
