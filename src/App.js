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
      text: "Hypnogram",
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
          return "N2";
        } else if (e.value === 1) {
          return "N1";
        } else {
          return " ";
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
      const data1 = data.slice(2, -2).map((row) => {
        const timeString = row[1]; // Value in column 2
        const time = moment(timeString, "h:mm:ss A"); // Convert to a time object
        return [...row.slice(0, 1), time, ...row.slice(2, 7)]; // Replace column 2 with the time object
      });
      setExcelData(data1);
      setAllData(data1);

      const data2 = data1.map((row) => row[1]);

      const data3 = data1.map((row) => row[4]);
      const data4 = data3.map((value) => {
        if (value === "Sleep stage W") {
          return 5;
        } else if (value === "Sleep stage R") {
          return 4;
        } else if (value === "Sleep stage 3") {
          return 1;
        } else if (value === "Sleep stage 2") {
          return 2;
        } else if (value === "Sleep stage 1") {
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
      // Find the first occurrence ofSleep stage N1
      const sleepStageN1Data = data1.find(
        (data) => data[4] === "Sleep stage 1"
      );

      const sleepStageRData = data1.find((data) => data[4] === "Sleep stage R");

      const sleepStageWData = data1.find((data) => data[4] === "Sleep stage W");

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
        const stage = data[4];
        const duration = parseFloat(data[3]);
        if (totalTimeByStage.hasOwnProperty(stage)) {
          totalTimeByStage[stage] += duration;
        } else {
          totalTimeByStage[stage] = duration;
        }
      });

      setTotalTimeByStage1(totalTimeByStage);

      setPieChartData(pieChartData);
      const data10 = Object.entries(totalTimeByStage).map(([label, value]) => {
        let modifiedLabel = label;
        if (label === "Sleep stage R") {
          modifiedLabel = "R";
        } else if (label === "Sleep stage 1") {
          modifiedLabel = "N1";
        } else if (label === "Sleep stage 2") {
          modifiedLabel = "N2";
        } else if (label === "Sleep stage 3") {
          modifiedLabel = "N3";
        } else if (label === "Sleep stage W") {
          modifiedLabel = "W";
        } else if (label === "Movementtime") {
          return {};
        } else if (label === "Sleep stage ?") {
          return {};
        }

        return {
          id: label,
          value,
          label: modifiedLabel,
        };
      });

      setPieChartData(data10);
    }
  };
  useEffect(() => {
    const totalTimeByStage = {};
    allData.forEach((data) => {
      const stage = data[4];
      const duration = parseFloat(data[3]);

      if (totalTimeByStage.hasOwnProperty(stage)) {
        totalTimeByStage[stage] += duration;
      } else {
        totalTimeByStage[stage] = duration;
      }
    });

    setTotalTimeByStage1(totalTimeByStage);

    const data10 = Object.entries(totalTimeByStage).map(([label, value]) => {
      let modifiedLabel = label;
      if (label === "Sleep stage R") {
        modifiedLabel = "R";
      } else if (label === "Sleep stage 1") {
        modifiedLabel = "N1";
      } else if (label === "Sleep stage 2") {
        modifiedLabel = "N2";
      } else if (label === "Sleep stage 3") {
        modifiedLabel = "N3";
      } else if (label === "Sleep stage W") {
        modifiedLabel = "W";
      } else if (label === "Movementtime") {
        return {};
      } else if (label === "Sleep stage ?") {
        return {};
      }

      return {
        id: label,
        value,
        label: modifiedLabel,
      };
    });

    setPieChartData(data10);

    // Find the first occurrence ofSleep stage N1
    const sleepStageN1Data = allData.find(
      (data) => data[4] === "Sleep stage 1"
    );

    const sleepStageRData = allData.find((data) => data[4] === "Sleep stage R");

    const sleepStageWData = allData.find((data) => data[4] === "Sleep stage W");

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

  const {
    "Sleep stage W": W,
    "Sleep stage R": R,
    "Sleep stage 3": S3,
    "Sleep stage 2": S2,
    "Sleep stage 1": S1,
  } = totalTimeByStage1;
  const conditionCount =
    ((S2 / (W + R + S3 + S2 + S1)) * 100 >= 40 &&
    (S2 / (W + R + S3 + S2 + S1)) * 100 <= 60
      ? 1
      : 0) +
    ((S3 / (W + R + S3 + S2 + S1)) * 100 >= 15 &&
    (S3 / (W + R + S3 + S2 + S1)) * 100 <= 30
      ? 1
      : 0) +
    ((R / (W + R + S3 + S2 + S1)) * 100 >= 15 &&
    (R / (W + R + S3 + S2 + S1)) * 100 <= 30
      ? 1
      : 0);

  function handleReload() {
    window.location.reload();
  }
  return (
    <div className="wrapper">
      <h1>10 sleep parameters according to AASM standards</h1>

      {/* form */}
      <form className="form-group custom-form" onSubmit={handleFileSubmit}>
        <div className="row">
          <div className="col">
            <input
              type="file"
              className="form-control mt-2"
              required
              onChange={handleFile}
            />
          </div>
          <div className="col-auto">
            <button type="submit" className="btn-success btn">
              Upload
            </button>

            {excelData ? (
              <button
                type="button"
                className="btn btn-danger ms-1"
                onClick={handleReload}
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
        {typeError && (
          <div className="alert alert-danger" role="alert">
            {typeError}
          </div>
        )}
      </form>
      <hr></hr>

      {/* view data */}

      {excelData ? (
        <div className="chart-options  justify-content-center">
          <div className="row">
            <div className="row col-5">
              <div className="col-md-4 mt-2">
                <div className="input-group mb-3">
                  <span className="input-group-text">Night</span>
                  <input type="text" className="form-control" />
                </div>
              </div>
              <div className="col-md-4 mt-2">
                <div className="input-group mb-3">
                  <span className="input-group-text">Age</span>
                  <input type="number" className="form-control" />
                </div>
              </div>
              <div className="col-md-4 mt-2">
                <div className="input-group mb-3">
                  <span className="input-group-text">Sex</span>
                  <input type="text" className="form-control" />
                </div>
              </div>
            </div>
            <div className="col-md-3 mt-2">
              <div className="input-group mb-3">
                <span className="input-group-text">Lights Off</span>
                <input
                  type="time"
                  className="form-control pt-2"
                  defaultValue={stepChartData[0].x.toTimeString().slice(0, 8)}
                  onChange={handleStartTimeChange}
                />
              </div>
            </div>
            <div className="col-md-3 mt-2">
              <div className="input-group mb-3">
                <span className="input-group-text">Lights On</span>
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
            <div className="col-md-1">
              <div className="input-group">
                <button
                  type="submit"
                  className="btn-success btn"
                  onClick={handleTimeChange}
                >
                  Load
                </button>
              </div>
            </div>
          </div>
          <hr></hr>
        </div>
      ) : null}

      {excelData ? (
        <div className="">
          <div className="row align-items-center">
            <div className="col-8">
              <h5 className="text-center pb-3">
                <strong>Data Analysis</strong>
              </h5>
              <div className="row">
                <div className="col-6">
                  <p>
                    <strong>Sleep latency:</strong> {sleepLatency}
                  </p>
                  <p>
                    <strong>Stage R latency:</strong> {sleepLatencyR}
                  </p>
                  <p>
                    <strong>Total sleep time (TST):</strong>{" "}
                    {moment
                      .utc(
                        (totalTimeByStage1["Sleep stage R"] +
                          totalTimeByStage1["Sleep stage 3"] +
                          totalTimeByStage1["Sleep stage 2"] +
                          totalTimeByStage1["Sleep stage 1"]) *
                          1000
                      )
                      .format("HH:mm:ss")}
                  </p>
                  <p>
                    <strong>Total recording time (TRT):</strong> {formattedTRT}
                  </p>
                  <p>
                    <strong>Wake after sleep onset (WASO):</strong> {waso}
                  </p>
                  <p>
                    <strong>Percent sleep efficiency:</strong>{" "}
                    {(
                      ((totalTimeByStage1["Sleep stage R"] +
                        totalTimeByStage1["Sleep stage 3"] +
                        totalTimeByStage1["Sleep stage 2"] +
                        totalTimeByStage1["Sleep stage 1"]) *
                        100) /
                      moment.duration(formattedTRT).asSeconds()
                    ).toFixed(2)}
                    %
                  </p>
                </div>
                <div className="col-6">
                  <table class="table table-bordered">
                    <thead>
                      <tr>
                        <th>Sleep stage</th>
                        <th>Value</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Sleep stage W</td>
                        <td>{totalTimeByStage1["Sleep stage W"]} s</td>
                        <td>
                          {(
                            (totalTimeByStage1["Sleep stage W"] /
                              (totalTimeByStage1["Sleep stage W"] +
                                totalTimeByStage1["Sleep stage R"] +
                                totalTimeByStage1["Sleep stage 3"] +
                                totalTimeByStage1["Sleep stage 2"] +
                                totalTimeByStage1["Sleep stage 1"])) *
                            100
                          ).toFixed(2)}
                          %
                        </td>
                      </tr>
                      <tr>
                        <td>Sleep stage R</td>
                        <td>{totalTimeByStage1["Sleep stage R"]} s</td>
                        <td>
                          {(
                            (totalTimeByStage1["Sleep stage R"] /
                              (totalTimeByStage1["Sleep stage W"] +
                                totalTimeByStage1["Sleep stage R"] +
                                totalTimeByStage1["Sleep stage 3"] +
                                totalTimeByStage1["Sleep stage 2"] +
                                totalTimeByStage1["Sleep stage 1"])) *
                            100
                          ).toFixed(2)}
                          %
                        </td>
                      </tr>
                      <tr>
                        <td>Sleep stage N3</td>
                        <td>{totalTimeByStage1["Sleep stage 3"]} s</td>
                        <td>
                          {(
                            (totalTimeByStage1["Sleep stage 3"] /
                              (totalTimeByStage1["Sleep stage W"] +
                                totalTimeByStage1["Sleep stage R"] +
                                totalTimeByStage1["Sleep stage 3"] +
                                totalTimeByStage1["Sleep stage 2"] +
                                totalTimeByStage1["Sleep stage 1"])) *
                            100
                          ).toFixed(2)}
                          %
                        </td>
                      </tr>
                      <tr>
                        <td>Sleep stage N2</td>
                        <td>{totalTimeByStage1["Sleep stage 2"]} s</td>
                        <td>
                          {(
                            (totalTimeByStage1["Sleep stage 2"] /
                              (totalTimeByStage1["Sleep stage W"] +
                                totalTimeByStage1["Sleep stage R"] +
                                totalTimeByStage1["Sleep stage 3"] +
                                totalTimeByStage1["Sleep stage 2"] +
                                totalTimeByStage1["Sleep stage 1"])) *
                            100
                          ).toFixed(2)}
                          %
                        </td>
                      </tr>
                      <tr>
                        <td>Sleep stage N1</td>
                        <td>{totalTimeByStage1["Sleep stage 1"]} s</td>
                        <td>
                          {(
                            (totalTimeByStage1["Sleep stage 1"] /
                              (totalTimeByStage1["Sleep stage W"] +
                                totalTimeByStage1["Sleep stage R"] +
                                totalTimeByStage1["Sleep stage 3"] +
                                totalTimeByStage1["Sleep stage 2"] +
                                totalTimeByStage1["Sleep stage 1"])) *
                            100
                          ).toFixed(2)}
                          %
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-4">
              <h5 className="text-center pb-3">
                <strong>Pie Chart</strong>
              </h5>
              <PieChart
                series={[
                  {
                    data: pieChartData,
                  },
                ]}
                height={200}
              />
            </div>
          </div>
        </div>
      ) : null}

      {excelData ? (
        <>
          {conditionCount === 3 && (
            <div className="alert alert-success text-center">
              <div>
                <strong>User Status: </strong>Tình trạng bình thường
              </div>
            </div>
          )}
          {(conditionCount === 2 || conditionCount === 1) && (
            <div className="alert alert-warning text-center">
              <div>
                <strong>User Status: </strong>Tình trạng xem xét
              </div>
            </div>
          )}

          {conditionCount === 0 && (
            <div className="alert alert-danger text-center">
              <div>
                <strong>User Status: </strong>Tình trạng bất thường
              </div>
            </div>
          )}
        </>
      ) : null}

      {excelData ? (
        <CanvasJSChart
          options={options}
          /* onRef={ref => this.chart = ref} */
        />
      ) : null}

      {excelData ? null : (
        <div className="viewer">
          <div>No File is uploaded yet!</div>
        </div>
      )}
    </div>
  );
}

export default App;
