import { readFile } from 'fs/promises';
import { runEvaluations } from './orchestrator.js';
import { config } from 'dotenv';
config()

async function initalizeEvals() {
    const file = await readFile(process.cwd() + '/src/evals/datasets/schema_analyser_golden_dataset_20.json', { encoding: 'utf-8' });
    const dataset = JSON.parse(file);
    const connectionDetails = {
        "host": "localhost",
        "port": "3306",
        "user": "root",
        "password": "root",
        "database": "vendure"
    };

    await runEvaluations(dataset, connectionDetails);
}
initalizeEvals();
