export const CODE_SNIPPETS = {
    python: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

X = np.array([[1.0], [2.0], [3.5], [5.0], [7.0], [9.0]])
y = np.array([52, 58, 67, 77, 88, 97])

model = LinearRegression(fit_intercept=True)
model.fit(X, y)

w = model.coef_[0]
b = model.intercept_
y_pred = model.predict(X)

mse = mean_squared_error(y, y_pred)
r2 = r2_score(y, y_pred)

print(f"Model: y = {w:.3f}x + {b:.3f}")
print(f"MSE: {mse:.2f}, R2: {r2:.4f}")`,

    javascript: `function computeOLS(points) {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
    }
    const denom = n * sumX2 - sumX * sumX;
    const w = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - w * sumX) / n;
    return { w, b };
}

const data = [{x: 1, y: 52}, {x: 2, y: 58}, {x: 5, y: 77}];
const { w, b } = computeOLS(data);
console.log(\`y = \${w.toFixed(2)}x + \${b.toFixed(2)}\`);`,

    cpp: `#include <iostream>
#include <vector>

struct Point { double x, y; };

std::pair<double, double> fitOLS(const std::vector<Point>& pts) {
    int n = pts.size();
    double sx = 0, sy = 0, sxy = 0, sx2 = 0;
    for (const auto& p : pts) {
        sx += p.x; sy += p.y;
        sxy += p.x * p.y; sx2 += p.x * p.x;
    }
    double denom = n * sx2 - sx * sx;
    double w = (n * sxy - sx * sy) / denom;
    double b = (sy - w * sx) / n;
    return {w, b};
}

int main() {
    std::vector<Point> pts = {{1, 52}, {2, 58}, {5, 77}, {9, 97}};
    auto [w, b] = fitOLS(pts);
    std::cout << "y = " << w << "x + " << b << "\\n";
    return 0;
}`,

    java: `import java.util.List;

public class LinearRegression {
    record Point(double x, double y) {}

    public static double[] fitOLS(List<Point> pts) {
        int n = pts.size();
        double sx = 0, sy = 0, sxy = 0, sx2 = 0;
        for (Point p : pts) {
            sx += p.x; sy += p.y;
            sxy += p.x * p.y; sx2 += p.x * p.x;
        }
        double denom = n * sx2 - sx * sx;
        double w = (n * sxy - sx * sy) / denom;
        double b = (sy - w * sx) / n;
        return new double[]{w, b};
    }

    public static void main(String[] args) {
        var pts = List.of(new Point(1, 52), new Point(2, 58), new Point(5, 77));
        double[] params = fitOLS(pts);
        System.out.printf("y = %.3fx + %.3f%n", params[0], params[1]);
    }
}`,

    go: `package main

import "fmt"

type Point struct { X, Y float64 }

func fitOLS(pts []Point) (float64, float64) {
    n := float64(len(pts))
    var sx, sy, sxy, sx2 float64
    for _, p := range pts {
        sx += p.X; sy += p.Y
        sxy += p.X * p.Y; sx2 += p.X * p.X
    }
    denom := n*sx2 - sx*sx
    w := (n*sxy - sx*sy) / denom
    b := (sy - w*sx) / n
    return w, b
}

func main() {
    pts := []Point{{1, 52}, {2, 58}, {5, 77}}
    w, b := fitOLS(pts)
    fmt.Printf("y = %.3fx + %.3f\\n", w, b)
}`
};
