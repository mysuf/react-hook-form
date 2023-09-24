import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { useForm } from '../../useForm';
import { FormProvider, useFormContext } from '../../useFormContext';

describe('formState', () => {
  it('should properly set isDirty when disabled is dynamicaly changed', async () => {
    const spyError = jest.spyOn(console, 'error');
    let isFormDirty: null | boolean = null;
    const defaultValues = { name: 'initial', disableName: true };
  
    const FieldList = () => {
      const { formState: { isDirty, dirtyFields },  register, watch, reset } = useFormContext();
      const disableName = watch('disableName');
      isFormDirty = isDirty;

      // we haven't form data so we won't render fields
      if (disableName === undefined) {
        return (
          <button
            type="button"
            data-testid="fetch-btn"
            onClick={() => reset(defaultValues)}
          >
            Emulate fetch form values
          </button>
        );
      }

      return (
        <>
          <input type="text" {...register('name', {  disabled: disableName })} data-testid="text-input" />
          <div>Text input dirty: {dirtyFields.name ? "true" : "false"}</div>
          <input type="checkbox" {...register('disableName', { disabled: false })} />
          <div>Checkbox dirty: {dirtyFields.disableName ? "true" : "false"}</div>
        </>
      );      
    }

    const App = () => {
      const methods = useForm();

      return (
        <FormProvider {...methods}>
          <form>
            <FieldList />
          </form>
        </FormProvider>
      );
    };

    render(<App />);
  
    const reset = screen.getByTestId("fetch-btn");
      
    // FAILS
    // user didn't touch single field yet so isFormDirty should be false
    // lets skip it to get further
    //expect(isFormDirty).toBe(false);

    fireEvent.click(reset);

    const checkbox = screen.getByRole('checkbox');
    const textInput = screen.getByTestId("text-input");

    await waitFor(() => {
      expect(checkbox).toBeChecked();

      expect(textInput).toBeDisabled();

      // FAILS and triggers https://github.com/react-hook-form/react-hook-form/issues/10908
      // this spy check should be bind to all tests
      expect(spyError).not.toHaveBeenCalled();

      // FAILS
      // user didn't touch single field yet so isFormDirty should be false
      expect(isFormDirty).toBe(false);
    });


    // now user changes value first time
    fireEvent.click(checkbox);

    // checkbox was clicked and its value differs from defaultValue so isFormDirty should be true
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
      expect(textInput).not.toBeDisabled();
      expect(isFormDirty).toBe(true);
    });

    // text input is enabled and is now editable so we change value
    fireEvent.change(textInput, {target: {value: 'foo'}});

    // form should be still dirty
    await waitFor(() => expect(isFormDirty).toBe(true));

    // user returns checkbox's value to defaultValue which disables textInput
    fireEvent.click(checkbox);
    
    // now form should be in initial state
    await waitFor(() => {
      expect(checkbox).toBeChecked();

      expect(textInput).toBeDisabled();

      expect(isFormDirty).toBe(false);
    });
  });
});
