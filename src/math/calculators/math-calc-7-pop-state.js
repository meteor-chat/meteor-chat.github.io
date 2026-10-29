import { stepPopulationGeneration, isPopulationIdentical, calculatePopulationDiversity } from "./math-calc-7-engine.js";

const DEFAULT_POPULATION = [
    "11001011",
    "11011111",
    "01010101",
    "10101010"
];

export class PopulationCrossoverManager {
    constructor(initialPop = DEFAULT_POPULATION, maxGenerations = 5, pc = 0.8) {
        this.initialPopulation = [...initialPop];
        this.currentPopulation = [...initialPop];
        this.maxGenerations = maxGenerations;
        this.pc = pc;
        this.crossoverType = "single";
        this.cutParams = { k: 4 };
        this.generation = 0;
        this.status = "running";
        this.statusMessage = "Iterasi siap dijalankan";
        this.history = [];
        this.lastStepResult = null;
        this.checkInitialState();
    }

    checkInitialState() {
        if (isPopulationIdentical(this.currentPopulation)) {
            this.status = "stopped_converged";
            this.statusMessage = "Semua kromosom awal identik (pola konvergen sebelum crossover)";
        }
    }

    setPopulation(pop) {
        this.initialPopulation = [...pop];
        this.reset();
    }

    setMaxGenerations(val) {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 1) {
            this.maxGenerations = num;
            if (this.generation >= this.maxGenerations && this.status === "running") {
                this.status = "stopped_max_gen";
                this.statusMessage = `Batas maksimum iterasi (${this.maxGenerations}) tercapai`;
            }
        }
    }

    setPc(val) {
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0 && num <= 1) {
            this.pc = num;
        }
    }

    setCrossoverType(type, params = {}) {
        this.crossoverType = type;
        this.cutParams = { ...params };
    }

    reset() {
        this.currentPopulation = [...this.initialPopulation];
        this.generation = 0;
        this.history = [];
        this.lastStepResult = null;
        this.status = "running";
        this.statusMessage = "Iterasi direset ke generasi awal (t = 0)";
        this.checkInitialState();
    }

    step(rng = Math.random) {
        if (this.status !== "running") {
            return {
                finished: true,
                status: this.status,
                statusMessage: this.statusMessage,
                generation: this.generation,
                population: this.currentPopulation,
                lastStepResult: this.lastStepResult
            };
        }

        const parentsSnapshot = [...this.currentPopulation];
        const stepResult = stepPopulationGeneration(
            parentsSnapshot,
            this.pc,
            this.crossoverType,
            this.cutParams,
            rng
        );

        if (!stepResult.valid) {
            this.status = "error";
            this.statusMessage = stepResult.errorMsg || "Gagal melakukan crossover";
            return { finished: true, status: this.status, statusMessage: this.statusMessage };
        }

        this.generation += 1;
        this.currentPopulation = [...stepResult.offspring];
        this.lastStepResult = stepResult;

        this.history.push({
            generation: this.generation,
            parents: parentsSnapshot,
            pairs: stepResult.pairs,
            offspring: stepResult.offspring,
            diversity: stepResult.diversity,
            isIdentical: stepResult.isIdentical
        });

        if (stepResult.isIdentical) {
            this.status = "stopped_converged";
            this.statusMessage = "Konvergensi pola tercapai: semua anak kromosom memiliki pola identik (diversitas = 0%)";
        } else if (this.generation >= this.maxGenerations) {
            this.status = "stopped_max_gen";
            this.statusMessage = `Batas maksimum iterasi (${this.maxGenerations}) telah tercapai`;
        } else {
            this.statusMessage = `Generasi ${this.generation} selesai. Menghasilkan ${stepResult.offspring.length} anak kromosom.`;
        }

        return {
            finished: this.status !== "running",
            status: this.status,
            statusMessage: this.statusMessage,
            generation: this.generation,
            parents: parentsSnapshot,
            population: this.currentPopulation,
            lastStepResult: stepResult,
            diversity: stepResult.diversity
        };
    }

    getState() {
        return {
            generation: this.generation,
            maxGenerations: this.maxGenerations,
            pc: this.pc,
            status: this.status,
            statusMessage: this.statusMessage,
            initialPopulation: this.initialPopulation,
            currentPopulation: this.currentPopulation,
            lastStepResult: this.lastStepResult,
            history: this.history,
            diversity: calculatePopulationDiversity(this.currentPopulation)
        };
    }
}
