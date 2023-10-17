import * as express from "express";
import * as cors from "cors";
import * as fs from "fs-extra";
import { api } from "./routes";
import { NOTEBOOK_TMP_PATH } from "./config";

//
// Remove previously evaluated notebooks.
//
fs.removeSync(NOTEBOOK_TMP_PATH);

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(api);

app.listen(port, () => {
    console.log(`Evaluation engine listening on port ${port}`)
});
