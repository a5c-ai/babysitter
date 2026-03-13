# Technical Interviewer Agent

A realistic FAANG-style technical interviewer agent for mock coding interviews and interview preparation.

## Overview

The Technical Interviewer agent simulates the experience of a technical coding interview at a top tech company. It presents problems clearly, provides progressive hints, asks follow-up questions, evaluates communication, and delivers structured feedback to help candidates prepare for real interviews.

## Quick Start

### Start a Mock Interview

```
User: I want to practice a medium-level array problem

Interviewer:
Great! Let's get started. I'm a senior engineer at a tech company, and
I'll be your interviewer today. I'm interested in seeing how you approach
problems, so please think aloud as you work.

Here's the problem:

---
**Two Sum**

Given an array of integers `nums` and an integer `target`, return the
indices of the two numbers that add up to `target`.

You may assume that each input would have exactly one solution, and you
may not use the same element twice.

**Example 1:**
- Input: nums = [2, 7, 11, 15], target = 9
- Output: [0, 1]
- Explanation: nums[0] + nums[1] = 2 + 7 = 9

**Example 2:**
- Input: nums = [3, 2, 4], target = 6
- Output: [1, 2]

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists
---

Before you start, do you have any questions about the problem?
```

## Features

### Realistic Interview Simulation

The agent provides:
- Natural conversation flow
- Appropriate timing for hints
- Follow-up questions
- Edge case challenges
- Complexity discussions

### Progressive Hint System

| Stage | Timing | Hint Level |
|-------|--------|------------|
| Encouragement | 2-3 min silent | "What's your initial thought?" |
| Direction | 5 min stuck | "Think about what data structure could help" |
| Technique | 8 min stuck | "A hash table might be useful here" |
| Key Insight | 10+ min stuck | "For each number, check if complement exists" |

### Company-Specific Styles

```
User: Practice a Google-style interview

Interviewer:
[Conducts interview with Google emphasis:]
- Multiple solution approaches expected
- Heavy focus on complexity analysis
- Follow-up optimization questions
- Extension problems
```

```
User: Practice an Amazon-style interview

Interviewer:
[Conducts interview with Amazon emphasis:]
- Leadership principles woven in
- Customer-centric thinking
- Practical, working code focus
- Scalability discussions
```

## Use Cases

### Full Mock Interview

```
User: Give me a 45-minute mock interview for a senior position

Interviewer:
[Conducts complete interview:]
1. Introduction (2 min)
2. Problem presentation (5 min)
3. Solution development (25 min)
4. Coding and testing (10 min)
5. Follow-up questions (3 min)
6. Candidate questions (2 min)

[Provides detailed feedback at end]
```

### Hint Practice

```
User: I want to practice without hints to test myself

Interviewer:
Understood! I'll only give hints if you explicitly ask for them.
Let's begin with the problem...

[Waits for candidate to ask for hints]
```

### Communication Practice

```
User: Focus on evaluating my communication

Interviewer:
I'll pay special attention to how you explain your thinking.

During the interview:
- "Can you elaborate on that approach?"
- "Walk me through why you made that choice"
- "How would you explain this to a teammate?"

[Provides detailed communication feedback]
```

## Interview Flow Examples

### Clarification Phase

```
Candidate: Can there be duplicate values in the array?

Interviewer:
Yes, there can be duplicates. The key constraint is that you can't use
the same element (same index) twice, but different indices with the same
value are fine.

Does that clarify things?
```

### Hint Phase

```
[Candidate struggles for 5 minutes]

Interviewer:
I see you're thinking about this. Let me give you a nudge - what if
you think about what information you need to look up quickly, and
what data structure would support that?

[Candidate mentions hash table]

Good instinct! How would you use that here?
```

### Follow-Up Phase

```
Candidate: [Presents O(n) solution using hash table]

Interviewer:
Nice solution! A few follow-up questions:

1. What's the space complexity? Is there any way to reduce it?

2. What if I told you the array was sorted? Would that change your
   approach?

3. What if we needed to find three numbers that sum to a target?
```

### Debugging Phase

```
Candidate: [Code has a bug]

Interviewer:
Let's trace through your solution with this example: [2, 7, 11, 15],
target = 9.

[Walks through execution]

I notice something on line 5. Can you take another look at what
happens when we check the second element?
```

## Feedback Template

```markdown
# Mock Interview Feedback

## Performance Summary
Overall: **Hire Recommendation**

You demonstrated solid problem-solving skills and good communication.
You identified the optimal approach after a small hint and implemented
it correctly.

## Detailed Scores

| Criterion | Score | Notes |
|-----------|-------|-------|
| Problem Solving | 8/10 | Found optimal approach, good pattern recognition |
| Coding | 7/10 | Clean code, minor edge case miss |
| Communication | 9/10 | Excellent thought articulation |
| Complexity Analysis | 8/10 | Accurate analysis, good explanation |

## Strengths
- Clear verbal communication of thought process
- Quickly recognized hash table pattern
- Asked good clarifying questions

## Areas for Improvement
- Test more edge cases before declaring "done"
- Consider space complexity optimization earlier
- Practice explaining complexity more concisely

## Recommended Practice
- LeetCode: Valid Anagram, Group Anagrams (similar patterns)
- Focus: Edge case enumeration before coding
```

## Configuration Options

### Interview Settings

```yaml
interview:
  duration: 45  # minutes
  difficulty: medium
  topics: [arrays, hash-table, two-pointers]
  company: google
  position: senior
  hints: progressive  # none | on-request | progressive
  followups: true
```

### Evaluation Focus

```yaml
evaluation:
  problem_solving: 30%
  coding: 25%
  communication: 25%
  complexity: 20%
```

## Integration

### With Interview Problem Bank

```javascript
// Select appropriate problem
const problem = await problemBank.getRandom({
  difficulty: 'medium',
  pattern: 'hash-table',
  company: 'google'
});

// Conduct interview
const interview = await technicalInterviewer.conduct({
  problem,
  duration: 45,
  style: 'google'
});

// Get feedback
const feedback = interview.getFeedback();
```

### With Other Agents

- **interview-coach**: Pre-interview preparation
- **complexity-analyst**: Validate candidate's analysis
- **solution-explainer**: Explain optimal solution post-interview

## API Reference

### `startInterview(options: InterviewOptions): Interview`

Begin a new mock interview session.

### `provideHint(level?: number): string`

Give a hint at specified level (1-4) or auto-escalate.

### `askFollowUp(type: string): string`

Ask a follow-up question (optimization, scale, edge-case).

### `evaluateResponse(response: string): Evaluation`

Evaluate candidate's response to a question.

### `generateFeedback(): Feedback`

Generate comprehensive post-interview feedback.

## Related Agents

- **interview-coach**: Interview preparation coaching
- **complexity-analyst**: Solution complexity verification
- **competitive-programmer**: Alternative problem-solving approach

## References

- [Interviewing.io](https://interviewing.io/)
- [Pramp](https://www.pramp.com/)
- [AI Mock Interviewer](https://github.com/IliaLarchenko/Interviewer)
- [Tech Interview Handbook](https://www.techinterviewhandbook.org/)
