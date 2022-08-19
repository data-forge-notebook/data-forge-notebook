import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as fs from "fs-extra";
import { api } from "./routes";

//
// Remove previously evaluated notebooks.
//
fs.removeSync("./tmp");

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(api);

app.listen(port, () => {
    console.log(`Evaluation engine listening on port ${port}`)
});
