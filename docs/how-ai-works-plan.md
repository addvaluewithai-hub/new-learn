# Course plan: How AI actually works — map v3 (after independent review)

Learner: web developer (JS/TS) who builds agents; complete beginner in math, CS theory, statistics.
Delivery: scripted audio lessons (read word for word, scripted feedback), Egyptian Arabic with English
terms, 3–4 scenes, 12–18 min each. Every lesson opens with a 60-second retrieval question on the last one.
Math: intuition, everyday analogy, tiny head-math, concept name; explain-it-back checks when numbers are hard.
Stale facts dated "as of October 2026". Contested findings presented as case studies.
Each scene carries an "avoid" list of misconceptions. Labs optional at a keyboard (JS first; Python labelled).

## Part 1 — The big picture and the first model (6)

1. The big picture: AI/ML/deep learning in one scene; history (perceptron 1958, backprop 1986, AlexNet 2012,
   Transformer 2017, GPT-3 2020, ChatGPT 2022, reasoning models 2024–); the Bitter Lesson; an LLM =
   next-token predictor + heavy post-training.
2. Growth and logarithms: functions as input→output; exponential growth; logs as "how many multiplications";
   log scales.
3. Data and the first model: learning from examples; fitting a line; loss; train vs test; overfitting;
   the three kinds of learning (supervised, self-supervised, reinforcement — preview).
4. Downhill: derivatives as rates; gradient as the downhill direction over many knobs; chain rule as gears;
   gradient descent fits the line; mini-batches ("estimate downhill from a sample").
5. Neural networks and backpropagation: neuron, ReLU, layers, the training loop; micrograd told as a story.
6. Probability, softmax and cross-entropy: distributions; mean and variance; softmax turns scores into
   probabilities; classification; cross-entropy as average surprise (the bridge to language models).
   Lab: dot product, line fit by gradient descent, a tiny neural net in plain JS (micrograd-style).

## Part 2 — From words to a transformer (6)

7. Vectors and embeddings: vectors as lists with meaning; dot product and cosine similarity; tokens become
   vectors; word2vec analogies as history (with caveat); meaning built in context.
8. Matrices and GPUs: a matrix as "each output is a different mix of the same ingredients"; why GPUs.
9. Tokens: BPE on "banana" and on one Arabic word; vocab size; spelling/counting problems; cost per token.
10. Computers for AI: precision (FP32/BF16/INT8); model size (params × bytes); training memory (~16 B/param
    with Adam) vs inference (~2 B); Big-O; memory bandwidth limits decoding.
11. Transformer I — attention: attention began on RNNs (Bahdanau 2014); the Transformer's win = parallel
    training; query/key/value on one recurring sentence ("it" finding its noun); multi-head; causal mask;
    cost with length (and FlashAttention).
12. Transformer II — the block: MLP layers (storage is a simplification), residual stream, layer norm,
    position by rotating (RoPE), Mixture of Experts; logits → softmax → sampling, temperature.
    Lab: Karpathy "Let's build GPT" (Python) or Raschka ch. 2–4; a BPE tokenizer in JS; inspect API log-probs.

## Part 3 — How a model is built (7)

13. Pretraining data and the base model: Common Crawl, filtering, dedup; a base model completes documents;
    in-context learning and induction heads.
14. Scaling laws: power laws; Kaplan 2020, corrected by Chinchilla 2022; over-training small models
    (forward reference to inference cost); data limits and synthetic data; Epoch numbers, scoped.
15. Training at scale: Adam, learning-rate schedules, loss curves and instabilities, mixed precision;
    parallelism as a restaurant kitchen; communication; data centers and cost.
16. Reinforcement learning foundations: reward, policy, trial and error; policy gradient with a baseline
    ("make better-than-usual actions more likely"); AlphaZero.
17. Post-training I: SFT, chat templates and special tokens; RLHF — reward model, PPO; InstructGPT.
18. Post-training II: DPO; Constitutional AI / AI feedback; the assistant persona; reward hacking,
    overoptimization, sycophancy.
19. Reasoning models: chain of thought, "tokens to think"; RL with verifiable rewards; GRPO; DeepSeek-R1
    (the "aha" claim is contested); test-time compute; distilling reasoning.
    Lab: read nanochat end to end (Python; running it ≈ $100 of rented GPUs, optional).

## Part 4 — Running and building with models (5)

20. Inference I: prefill vs decode; KV cache; context windows; why output tokens cost more; prompt caching.
21. Inference II: quantization, speculative decoding, batching, distillation and small models; open-weights
    vs closed; running a model locally.
22. Agents I: tool calling is tokens; structured outputs and constrained decoding; how models are trained to
    use tools (agentic RL); the agent loop.
23. Agents II: context engineering; RAG with embedding models (contrastive training); LoRA fine-tuning;
    evaluating agents; why agents fail (error compounding, long horizons).
24. Agents III — security: prompt injection; data exfiltration; the "lethal trifecta"; defenses and limits.
    Lab: run a small model locally and check memory against lesson 10; measure prompt-caching savings;
    build a tool-calling loop by hand without an SDK.

## Part 5 — Beyond text, inside and limits (4)

25. Beyond text: images as patches (ViT); multimodal models; diffusion in one picture; native audio models.
26. Inside the black box: features as directions, superposition, sparse autoencoders; circuit case studies
    (planning rhymes, multi-step reasoning, an entity "don't know" circuit, unfaithful chain of thought),
    with the papers' own limits.
27. Hallucination and evaluation: why training and grading reward guessing (OpenAI 2025); benchmarks,
    contamination, saturation; jagged intelligence.
28. Alignment, safety and open questions: specification gaming, misuse, how labs test models; what is
    unknown as of October 2026; how to keep learning.

Total: 28 lessons (~7 hours).

## Sources

CS336 (Spring 2026); Karpathy (Zero to Hero, Deep Dive, nanochat); 3Blue1Brown; Jurafsky & Martin SLP3
(Aug 2026); Xiao & Zhu (Oct 2026); Prince UDL; Lambert RLHF Book; Raschka (2024, 2026); Ultra-Scale
Playbook; How to Scale Your Model; Chip Huyen, AI Engineering (2025); Anthropic: Building Effective Agents,
Effective Context Engineering, Transformer Circuits (Mathematical Framework, Induction Heads,
Monosemanticity, Biology of an LLM); OpenAI, Why Language Models Hallucinate (2025); Lilian Weng's blog;
Simon Willison on prompt injection; Epoch AI; OpenAI Spinning Up (RL); key papers (Bahdanau 2014,
Vaswani 2017, Kaplan 2020, Hoffmann 2022, Ouyang 2022, Rafailov 2023, DeepSeek-R1 2025).
