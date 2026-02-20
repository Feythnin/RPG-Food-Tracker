import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

type Mode = 'lose' | 'gain' | 'maintain';
type Sex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface FormData {
  mode: Mode | '';
  sex: Sex | '';
  heightFeet: number;
  heightInches: number;
  currentWeight: number;
  age: number;
  goalWeight: number;
  activityLevel: ActivityLevel | '';
  waterGoalOz: number;
}

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little or no exercise)',
  light: 'Light (exercise 1-3 days/week)',
  moderate: 'Moderate (exercise 3-5 days/week)',
  active: 'Active (exercise 6-7 days/week)',
  very_active: 'Very Active (intense daily exercise)',
};

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    mode: '',
    sex: '',
    heightFeet: 5,
    heightInches: 6,
    currentWeight: 150,
    age: 25,
    goalWeight: 140,
    activityLevel: '',
    waterGoalOz: 64,
  });

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!form.mode) {
          setError('Please select a mode.');
          return false;
        }
        return true;
      case 2:
        if (!form.sex) {
          setError('Please select your sex.');
          return false;
        }
        {
          const totalInches = form.heightFeet * 12 + form.heightInches;
          if (totalInches < 48 || totalInches > 96) {
            setError('Height must be between 4\'0" and 8\'0".');
            return false;
          }
        }
        if (form.currentWeight < 50 || form.currentWeight > 700) {
          setError('Weight must be between 50 and 700 lbs.');
          return false;
        }
        if (form.age < 13 || form.age > 120) {
          setError('Age must be between 13 and 120.');
          return false;
        }
        return true;
      case 3:
        if (form.goalWeight < 50 || form.goalWeight > 700) {
          setError('Goal weight must be between 50 and 700 lbs.');
          return false;
        }
        if (!form.activityLevel) {
          setError('Please select an activity level.');
          return false;
        }
        return true;
      case 4:
        if (form.waterGoalOz < 32 || form.waterGoalOz > 256) {
          setError('Water goal must be between 32 and 256 oz.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const totalInches = form.heightFeet * 12 + form.heightInches;
      const { data } = await api.post('/profile/setup', {
        mode: form.mode,
        sex: form.sex,
        heightInches: totalInches,
        currentWeight: form.currentWeight,
        goalWeight: form.goalWeight,
        age: form.age,
        activityLevel: form.activityLevel,
        waterGoalOz: form.waterGoalOz,
      });
      setUser(data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Choose Your Path',
    'Body Stats',
    'Set Your Goals',
    'Hydration Quest',
    'Confirm Your Build',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="rpg-card p-8 w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  s < step
                    ? 'bg-accent-green text-bg-primary'
                    : s === step
                    ? 'bg-accent-gold text-bg-primary'
                    : 'bg-bg-secondary text-text-muted'
                }`}
              >
                {s < step ? '\u2713' : s}
              </div>
              {s < 5 && (
                <div
                  className={`h-0.5 flex-1 mx-1 ${
                    s < step ? 'bg-accent-green' : 'bg-bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <h1 className="text-2xl font-bold text-accent-gold text-center mb-2">
          {stepTitles[step - 1]}
        </h1>
        <p className="text-text-muted text-center mb-6 text-sm">Step {step} of 5</p>

        {/* Error banner */}
        {error && (
          <div className="bg-accent-red/20 border border-accent-red/50 text-accent-red rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Mode Select */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { mode: 'lose' as Mode, icon: '\u2694\uFE0F', title: 'Lose Weight', desc: 'Cut calories to shed fat and defeat enemies faster.' },
              { mode: 'gain' as Mode, icon: '\uD83D\uDEE1\uFE0F', title: 'Gain Weight', desc: 'Fuel muscle growth with a caloric surplus.' },
              { mode: 'maintain' as Mode, icon: '\u2696\uFE0F', title: 'Maintain', desc: 'Hold your ground and maintain current weight.' },
            ]).map(({ mode, icon, title, desc }) => (
              <button
                key={mode}
                onClick={() => updateForm('mode', mode)}
                className={`p-6 rounded-lg border-2 text-left transition-all hover:border-accent-gold/60 ${
                  form.mode === mode
                    ? 'border-accent-gold bg-accent-gold/10'
                    : 'border-accent-gold/20 bg-bg-secondary'
                }`}
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
                <p className="text-text-muted text-sm">{desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Body Stats */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Sex */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Biological Sex</label>
              <div className="flex gap-3">
                {(['male', 'female'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateForm('sex', s)}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold capitalize transition-all ${
                      form.sex === s
                        ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                        : 'border-accent-gold/20 bg-bg-secondary text-text-secondary hover:border-accent-gold/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Height</label>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.heightFeet}
                      onChange={(e) => updateForm('heightFeet', parseInt(e.target.value) || 0)}
                      className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
                      min={4}
                      max={8}
                    />
                    <span className="text-text-muted">ft</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.heightInches}
                      onChange={(e) => updateForm('heightInches', parseInt(e.target.value) || 0)}
                      className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
                      min={0}
                      max={11}
                    />
                    <span className="text-text-muted">in</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Weight */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Current Weight (lbs)</label>
              <input
                type="number"
                value={form.currentWeight}
                onChange={(e) => updateForm('currentWeight', parseFloat(e.target.value) || 0)}
                className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
                min={50}
                max={700}
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => updateForm('age', parseInt(e.target.value) || 0)}
                className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
                min={13}
                max={120}
              />
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Goal Weight */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Goal Weight (lbs)</label>
              <input
                type="number"
                value={form.goalWeight}
                onChange={(e) => updateForm('goalWeight', parseFloat(e.target.value) || 0)}
                className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
                min={50}
                max={700}
              />
              {form.mode === 'lose' && form.goalWeight >= form.currentWeight && (
                <p className="text-accent-orange text-xs mt-1">
                  Goal weight should be less than current weight for a weight-loss path.
                </p>
              )}
              {form.mode === 'gain' && form.goalWeight <= form.currentWeight && (
                <p className="text-accent-orange text-xs mt-1">
                  Goal weight should be more than current weight for a weight-gain path.
                </p>
              )}
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-text-secondary text-sm mb-2">Activity Level</label>
              <select
                value={form.activityLevel}
                onChange={(e) => updateForm('activityLevel', e.target.value as ActivityLevel)}
                className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold appearance-none"
              >
                <option value="" disabled>
                  Select activity level...
                </option>
                {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Water Goal */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="text-text-secondary text-sm text-center">
              Set your daily water intake goal. The default is 64 oz (8 glasses).
            </p>

            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min={32}
                max={256}
                step={8}
                value={form.waterGoalOz}
                onChange={(e) => updateForm('waterGoalOz', parseInt(e.target.value))}
                className="w-full accent-accent-gold"
              />
              <div className="flex justify-between text-text-muted text-xs mt-1">
                <span>32 oz</span>
                <span>256 oz</span>
              </div>
            </div>

            {/* Display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 bg-bg-secondary rounded-lg px-6 py-4 border border-accent-gold/20">
                <div>
                  <div className="text-3xl font-bold text-accent-blue">{form.waterGoalOz}</div>
                  <div className="text-text-muted text-xs">ounces</div>
                </div>
                <div className="w-px h-10 bg-accent-gold/20" />
                <div>
                  <div className="text-3xl font-bold text-accent-blue">
                    {Math.ceil(form.waterGoalOz / 8)}
                  </div>
                  <div className="text-text-muted text-xs">glasses</div>
                </div>
              </div>
            </div>

            {/* Manual input */}
            <div>
              <label className="block text-text-secondary text-sm mb-2 text-center">
                Or enter a specific amount (oz)
              </label>
              <input
                type="number"
                value={form.waterGoalOz}
                onChange={(e) => updateForm('waterGoalOz', parseInt(e.target.value) || 32)}
                className="w-full max-w-xs mx-auto block bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary text-center focus:outline-none focus:border-accent-gold"
                min={32}
                max={256}
              />
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-bg-secondary rounded-lg p-5 border border-accent-gold/20 space-y-3">
              <SummaryRow
                label="Mode"
                value={form.mode ? form.mode.charAt(0).toUpperCase() + form.mode.slice(1) + ' Weight' : ''}
              />
              <SummaryRow
                label="Sex"
                value={form.sex ? form.sex.charAt(0).toUpperCase() + form.sex.slice(1) : ''}
              />
              <SummaryRow
                label="Height"
                value={`${form.heightFeet}'${form.heightInches}"`}
              />
              <SummaryRow
                label="Current Weight"
                value={`${form.currentWeight} lbs`}
              />
              <SummaryRow label="Age" value={`${form.age} years`} />
              <SummaryRow
                label="Goal Weight"
                value={`${form.goalWeight} lbs`}
              />
              <SummaryRow
                label="Activity Level"
                value={
                  form.activityLevel
                    ? ACTIVITY_LABELS[form.activityLevel as ActivityLevel]
                    : ''
                }
              />
              <SummaryRow
                label="Daily Water Goal"
                value={`${form.waterGoalOz} oz (${Math.ceil(form.waterGoalOz / 8)} glasses)`}
              />
            </div>
            <p className="text-text-muted text-xs text-center">
              You can change these settings later from your profile page.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-6 py-2 rounded-lg border border-accent-gold/30 text-text-secondary hover:text-text-primary hover:border-accent-gold/50 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 rounded-lg bg-accent-gold text-bg-primary font-bold hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2 rounded-lg bg-accent-green text-bg-primary font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Creating Character...' : 'Begin Adventure'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-muted text-sm">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
}
