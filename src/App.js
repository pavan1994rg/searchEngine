import { useState } from "react";
import "./App.css";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Form,
  ProgressBar,
  InputGroup,
  Alert,
} from "react-bootstrap";

const axios = require("axios").default;

function App() {
  const [selectedFiles, setSelectedFiles] = useState();
  const [inputTitle, setInputTitle] = useState();
  const [searchText, setSearchText] = useState();
  const [alertBox, setAlertBox] = useState(false);
  const [progress, setProgress] = useState();
  const [searchResults, setSearchResults] = useState([]);

  const handleOnChange = (e) => {
    setInputTitle(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:9200/searchengine/_search", {
        query: {
          regexp: { docContent: `.*${searchText}.*` },
        },
      })
      .then((result) => {
        setSearchResults(result.data.hits.hits);
      });
  };

  var saveBlob = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (blob, fileName) {
      var url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  })();

  const downloadDocs = (e, url) => {
    e.preventDefault();
    axios
      .get("http://localhost:3000/?download=" + url, { responseType: "blob" })
      .then((result) => {
        const file = result.data;
        saveBlob(
          file,
          new Date().getDay() + new Date().getMonth() + new Date().getFullYear()
        );
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); //prevent the form from submitting
    let formData = new FormData();

    formData.append("myFile", selectedFiles[0]);

    axios
      .post("http://localhost:3000/fileUpload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (data) => {
          //Set the progress value to show the progress bar
          setProgress(Math.round((100 * data.loaded) / data.total));
        },
      })
      .then((result) => {
        const payload = {
          docName: inputTitle,
          doctype: result.data[0].url.split(".").pop(),
          fileUrl: result.data[0].url,
        };
        axios
          .post("http://localhost:3000/postData", payload)
          .then((response) => {
            setAlertBox(true);
            setTimeout(() => {
              setAlertBox(false);
            }, 2000);
          });

        setProgress(false);
      })
      .catch((e) => console.log(e));
  };
  return (
    <div className="centerContainer">
      <Container>
        <Row>
          <Col>
            <Card style={{ width: "18rem" }}>
              <Card.Body>
                <Card.Title>Upload File</Card.Title>
                <Card.Text>Upload File that you to search for</Card.Text>

                <Form
                  action="http://localhost:3000/fileUpload"
                  method="post"
                  encType="multipart/form-data"
                  onSubmit={handleSubmit}
                >
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="text"
                      aria-label="Title"
                      placeholder="Enter Title"
                      required
                      onChange={handleOnChange}
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide title
                    </Form.Control.Feedback>
                  </InputGroup>
                  <Form.Group>
                    <Form.Control
                      type="file"
                      required
                      onChange={(e) => {
                        setSelectedFiles(e.target.files);
                      }}
                    />
                  </Form.Group>
                  <Form.Control.Feedback type="invalid">
                    Please provide file
                  </Form.Control.Feedback>
                  <Form.Group>
                    <Button
                      className="buttonMargin"
                      variant="info"
                      type="submit"
                    >
                      Upload A File
                    </Button>
                  </Form.Group>
                  {progress && (
                    <ProgressBar
                      className="buttonMargin"
                      now={progress}
                      label={`${progress}%`}
                    />
                  )}
                </Form>
              </Card.Body>
            </Card>
            {alertBox ? (
              <Alert className="buttonMargin" variant="primary">
                Uploaded SuccessFully
              </Alert>
            ) : null}
          </Col>
          <Col>
            <Card className="marginBottom">
              <Card.Body>
                <Form onSubmit={handleSearchSubmit}>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="text"
                      aria-label="Title"
                      placeholder="Search Anything"
                      required
                      onChange={handleSearchChange}
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide title
                    </Form.Control.Feedback>
                  </InputGroup>
                  <Form.Group className="centerAlign">
                    <Button
                      className="buttonMargin"
                      variant="info"
                      type="submit"
                    >
                      Search
                    </Button>
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
            <div className="scrollView">
              {searchResults
                ? searchResults.map((rows) => {
                    return (
                      <div key={rows._id}>
                        <Card>
                          <Card.Body>
                            <Card.Title> {rows._source.docName}</Card.Title>
                            <Card.Text className="wrapText">
                              {rows._source.docContent}
                            </Card.Text>
                            <Button
                              variant="primary"
                              onClick={(e) => downloadDocs(e, rows._id)}
                            >
                              Download Document
                            </Button>
                          </Card.Body>
                        </Card>
                      </div>
                    );
                  })
                : null}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
