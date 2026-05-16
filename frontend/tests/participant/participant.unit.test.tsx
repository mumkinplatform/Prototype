import { describe, it, expect } from 'vitest';
import {
  computeSubmissionFieldStates,
  type ApiSubmission,
  type ProjectFormState,
} from '../../src/app/components/ParticipantWorkspace';

// Builds submission data with only the fields computeSubmissionFieldStates
// reads (submissionFields, files); the rest are placeholders.
function makeSubmission(overrides: Partial<ApiSubmission>): ApiSubmission {
  return {
    submissionId: 1,
    projectName: null,
    projectDescription: null,
    repoUrl: null,
    demoUrl: null,
    submittedAt: null,
    submissionStartDate: null,
    submissionDeadline: null,
    maxFileSizeMb: 50,
    submissionFields: [],
    requirements: [],
    expectedProjectsDescription: null,
    files: [],
    ...overrides,
  };
}

const emptyForm: ProjectFormState = {
  projectName: '',
  projectDescription: '',
  repoUrl: '',
  demoUrl: '',
};

describe('computeSubmissionFieldStates', () => {
  it('marks every required field as incomplete when the form is empty and no files are uploaded', () => {
    const data = makeSubmission({ submissionFields: ['title', 'desc', 'video'] });
    const states = computeSubmissionFieldStates(data, emptyForm);
    expect(states).toEqual([
      { id: 'title', label: 'عنوان المشروع', isFilled: false },
      { id: 'desc',  label: 'وصف المشروع',   isFilled: false },
      { id: 'video', label: 'فيديو توضيحي',  isFilled: false },
    ]);
  });

  it('marks text fields as complete when the form has values', () => {
    const data = makeSubmission({ submissionFields: ['title', 'desc'] });
    const form: ProjectFormState = {
      ...emptyForm,
      projectName: 'مشروعي',
      projectDescription: 'وصف الفكرة',
    };
    const states = computeSubmissionFieldStates(data, form);
    expect(states.every((s) => s.isFilled)).toBe(true);
  });

  it('only marks a "video" field as filled when an actual video file is uploaded', () => {
    const dataWithImage = makeSubmission({
      submissionFields: ['video'],
      files: [{ id: 1, name: 'screenshot.png', mimeType: 'image/png', size: 100, url: '', uploadedAt: '' }],
    });
    expect(computeSubmissionFieldStates(dataWithImage, emptyForm)[0].isFilled).toBe(false);

    const dataWithVideo = makeSubmission({
      submissionFields: ['video'],
      files: [{ id: 2, name: 'demo.mp4', mimeType: 'video/mp4', size: 5000, url: '', uploadedAt: '' }],
    });
    expect(computeSubmissionFieldStates(dataWithVideo, emptyForm)[0].isFilled).toBe(true);
  });
});
