import { Card, NumberCard, OperatorCard } from '../Card';

/**
 * Solve the problem using an array of Card instances (NumberCard or OperatorCard)
 * @param {Array<Card>} cardArray
 * @returns {number[] | null}
 */
export function solveProblem(cardArray: Card[]): number[] | null {
    // First we separate the card array into different problems - an array of strings
    let problems: string[] = [""];

    let lastWasNumber = false;
    cardArray.forEach(card => {
        if (!(card instanceof Card)) {
            console.log("Error: not a Card instance: " + JSON.stringify(card));
            return;
        }
        if (card instanceof OperatorCard) {
            lastWasNumber = false;
            // add operator 
            problems[problems.length - 1] += card.value;
        } else if (card instanceof NumberCard) {
            if (lastWasNumber === true) {
                // if the last entry was a number, we start a new problem
                problems.push("" + card.value);
            } else if (lastWasNumber === false) {
                // if the previous entry was an operator, we need to have numbers either sides
                problems[problems.length - 1] += card.value;
            }
            lastWasNumber = true;
        }
    });

    // solve each problem 
    let solutions: number[] = [];
    problems.forEach(problem => {
        let solution = solveStringProblem(problem);
        if (solution !== null) {
            solutions.push(solution);
        } else {
            console.log("Error: problem could not be solved: " + problem)
        }
    });

    return solutions;
}

/**
 * Evaluate a string math expression with operator precedence
 * Supports +, -, *, /, ^
 * @param {string} stringProblem
 * @returns {number}
 */
function solveStringProblem(stringProblem: string): number {
    // Tokenize
    const tokens: (string|number)[] = [];
    let numberBuffer = '';
    for (const char of stringProblem) {
        if (!isNaN(Number(char))) {
            numberBuffer += char;
        } else {
            if (numberBuffer.length > 0) {
                tokens.push(Number(numberBuffer));
                numberBuffer = '';
            }
            tokens.push(char);
        }
    }
    if (numberBuffer.length > 0) {
        tokens.push(Number(numberBuffer));
    }

    // Shunting Yard Algorithm to convert to Reverse Polish Notation (RPN)
    const output: (number|string)[] = [];
    const operators: string[] = [];
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
    const rightAssociative: Record<string, boolean> = { '^': true };

    for (const token of tokens) {
        if (typeof token === 'number') {
            output.push(token);
        } else if (typeof token === 'string' && precedence[token] !== undefined) {
            while (
                operators.length > 0 &&
                precedence[operators[operators.length - 1]] !== undefined &&
                (
                    (rightAssociative[token]
                        ? precedence[token] < precedence[operators[operators.length - 1]]
                        : precedence[token] <= precedence[operators[operators.length - 1]])
                )
            ) {
                output.push(operators.pop()!);
            }
            operators.push(token);
        }
    }
    while (operators.length > 0) {
        output.push(operators.pop()!);
    }

    // Evaluate RPN
    const stack: number[] = [];
    for (const token of output) {
        if (typeof token === 'number') {
            stack.push(token);
        } else if (typeof token === 'string') {
            const b = stack.pop() ?? 0;
            const a = stack.pop() ?? 0;
            switch (token) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': stack.push(a / b); break;
                case '^': stack.push(Math.pow(a, b)); break;
                default: stack.push(0);
            }
        }
    }
    return stack.length > 0 ? stack[0] : 0;
}