import * as tf from '@tensorflow/tfjs';

let model = null;

export async function loadISLModel() {
  if (model) return model;

  console.log('Loading ISL model...');

  model = await tf.loadLayersModel('/models/isl_alphabet/model.json');

  console.log('ISL model loaded!');
  console.log('Input shape:', model.inputs[0].shape);
  console.log('Output shape:', model.outputs[0].shape);

  return model;
}

export async function predictISL(imageTensor) {
  const loadedModel = await loadISLModel();

  const input = imageTensor
    .resizeBilinear([128, 128])
    .toFloat()
    .div(255.0)
    .expandDims(0);

  const prediction = loadedModel.predict(input);
  const probabilities = await prediction.data();

  input.dispose();
  prediction.dispose();

  let maxIndex = 0;

  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[maxIndex]) {
      maxIndex = i;
    }
  }

  return {
    index: maxIndex,
    confidence: probabilities[maxIndex]
  };
}