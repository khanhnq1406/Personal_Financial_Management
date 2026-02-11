import { BankTemplateStep } from "../BankTemplateStep";

/**
 * Integration test to verify BankTemplateStep component structure
 *
 * This is a simple type-check test to ensure:
 * 1. Component exports correctly
 * 2. Props interface is properly defined
 * 3. TypeScript types are valid
 */

// Type check: Verify component accepts required props
const TestUsage = () => {
  const handleTemplateSelected = (templateId: string | null) => {
    console.log("Selected template:", templateId);
  };

  const handleNext = () => {
    console.log("Next clicked");
  };

  const handleBack = () => {
    console.log("Back clicked");
  };

  return (
    <BankTemplateStep
      onTemplateSelected={handleTemplateSelected}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
};

export default TestUsage;
