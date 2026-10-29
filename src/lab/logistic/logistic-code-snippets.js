export const LOGISTIC_CODE_SAMPLES = {
    python: `import math

def sigmoid(z):
    z = max(-50.0, min(50.0, z))
    return 1.0 / (1.0 + math.exp(-z))

def train_step(points, w, b, lr=0.1, l2=0.0):
    n = len(points)
    dw = [0.0, 0.0]
    db = 0.0
    for x1, x2, y in points:
        z = w[0] * x1 + w[1] * x2 + b
        p = sigmoid(z)
        diff = p - y
        dw[0] += diff * x1
        dw[1] += diff * x2
        db += diff
    w[0] -= lr * ((dw[0] / n) + l2 * w[0])
    w[1] -= lr * ((dw[1] / n) + l2 * w[1])
    b -= lr * (db / n)
    return w, b`,

    javascript: `function sigmoid(z) {
    const clamped = Math.max(-50, Math.min(50, z));
    return 1 / (1 + Math.exp(-clamped));
}

function trainStep(points, w1, w2, b, lr = 0.1, lambda = 0.0) {
    const n = points.length;
    let dw1 = 0, dw2 = 0, db = 0;
    for (let i = 0; i < n; i++) {
        const { x1, x2, y } = points[i];
        const p = sigmoid(w1 * x1 + w2 * x2 + b);
        const diff = p - y;
        dw1 += diff * x1;
        dw2 += diff * x2;
        db += diff;
    }
    return {
        w1: w1 - lr * ((dw1 / n) + lambda * w1),
        w2: w2 - lr * ((dw2 / n) + lambda * w2),
        b: b - lr * (db / n)
    };
}`,

    c: `#include <stdio.h>
#include <math.h>

double sigmoid(double z) {
    if (z > 50.0) z = 50.0;
    if (z < -50.0) z = -50.0;
    return 1.0 / (1.0 + exp(-z));
}

void train_step(const double (*pts)[3], int n, double *w1, double *w2, double *b, double lr, double l2) {
    double dw1 = 0.0, dw2 = 0.0, db = 0.0;
    for (int i = 0; i < n; i++) {
        double p = sigmoid((*w1) * pts[i][0] + (*w2) * pts[i][1] + (*b));
        double diff = p - pts[i][2];
        dw1 += diff * pts[i][0];
        dw2 += diff * pts[i][1];
        db += diff;
    }
    *w1 -= lr * ((dw1 / n) + l2 * (*w1));
    *w2 -= lr * ((dw2 / n) + l2 * (*w2));
    *b -= lr * (db / n);
}`,

    cpp: `#include <vector>
#include <cmath>
#include <algorithm>

struct Point { double x1, x2, y; };

double sigmoid(double z) {
    z = std::clamp(z, -50.0, 50.0);
    return 1.0 / (1.0 + std::exp(-z));
}

void trainStep(const std::vector<Point>& pts, double& w1, double& w2, double& b, double lr, double l2) {
    double dw1 = 0.0, dw2 = 0.0, db = 0.0;
    const double n = static_cast<double>(pts.size());
    for (const auto& pt : pts) {
        double p = sigmoid(w1 * pt.x1 + w2 * pt.x2 + b);
        double diff = p - pt.y;
        dw1 += diff * pt.x1;
        dw2 += diff * pt.x2;
        db += diff;
    }
    w1 -= lr * ((dw1 / n) + l2 * w1);
    w2 -= lr * ((dw2 / n) + l2 * w2);
    b -= lr * (db / n);
}`,

    java: `public class LogisticRegression {
    public static double sigmoid(double z) {
        double clamped = Math.max(-50.0, Math.min(50.0, z));
        return 1.0 / (1.0 + Math.exp(-clamped));
    }

    public static void trainStep(double[][] data, double[] w, double lr, double l2) {
        int n = data.length;
        double dw1 = 0.0, dw2 = 0.0, db = 0.0;
        for (double[] row : data) {
            double p = sigmoid(w[0] * row[0] + w[1] * row[1] + w[2]);
            double diff = p - row[2];
            dw1 += diff * row[0];
            dw2 += diff * row[1];
            db += diff;
        }
        w[0] -= lr * ((dw1 / n) + l2 * w[0]);
        w[1] -= lr * ((dw2 / n) + l2 * w[1]);
        w[2] -= lr * (db / n);
    }
}`,

    golang: `package main

import "math"

type Point struct {
	X1, X2, Y float64
}

func sigmoid(z float64) float64 {
	if z > 50.0 { z = 50.0 }
	if z < -50.0 { z = -50.0 }
	return 1.0 / (1.0 + math.Exp(-z))
}

func TrainStep(pts []Point, w1, w2, b *float64, lr, l2 float64) {
	n := float64(len(pts))
	var dw1, dw2, db float64
	for _, p := range pts {
		prob := sigmoid((*w1)*p.X1 + (*w2)*p.X2 + *b)
		diff := prob - p.Y
		dw1 += diff * p.X1
		dw2 += diff * p.X2
		db += diff
	}
	*w1 -= lr * ((dw1 / n) + l2*(*w1))
	*w2 -= lr * ((dw2 / n) + l2*(*w2))
	*b -= lr * (db / n)
}`
};
