import { Check } from '@phosphor-icons/react';
import { Fragment } from 'react';

export default function StepIndicator({ passoAtual }: { passoAtual: number }) {
  const steps = [
    { num: 1, label: 'Fotos' },
    { num: 2, label: 'Dados' },
    { num: 3, label: 'Preço & Estado' },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, i) => (
        <Fragment key={step.num}>
          <div
            className={`step-dot ${
              passoAtual > step.num ? 'done-step' : passoAtual === step.num ? 'active-step' : ''
            }`}
            title={step.label}
          >
            {passoAtual > step.num ? <Check /> : step.num}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-1 transition-colors ${
                passoAtual > step.num ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
