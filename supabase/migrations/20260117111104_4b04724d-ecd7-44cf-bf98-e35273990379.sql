-- Fix search_path for update_financial_summary function
CREATE OR REPLACE FUNCTION public.update_financial_summary(p_month INTEGER, p_year INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_income BIGINT;
  v_total_expense BIGINT;
  v_net_profit BIGINT;
BEGIN
  -- Calculate total income for the month
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM public.financial_transactions
  WHERE transaction_type = 'income'
    AND EXTRACT(MONTH FROM transaction_date) = p_month
    AND EXTRACT(YEAR FROM transaction_date) = p_year;
  
  -- Calculate total expense for the month
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
  FROM public.financial_transactions
  WHERE transaction_type = 'expense'
    AND EXTRACT(MONTH FROM transaction_date) = p_month
    AND EXTRACT(YEAR FROM transaction_date) = p_year;
  
  -- Calculate net profit
  v_net_profit := v_total_income - v_total_expense;
  
  -- Insert or update summary
  INSERT INTO public.financial_summary (month, year, total_income, total_expense, net_profit)
  VALUES (p_month, p_year, v_total_income, v_total_expense, v_net_profit)
  ON CONFLICT (month, year)
  DO UPDATE SET
    total_income = EXCLUDED.total_income,
    total_expense = EXCLUDED.total_expense,
    net_profit = EXCLUDED.net_profit,
    updated_at = now();
END;
$$;

-- Fix search_path for trigger_update_financial_summary function
CREATE OR REPLACE FUNCTION public.trigger_update_financial_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_financial_summary(
      EXTRACT(MONTH FROM OLD.transaction_date)::INTEGER,
      EXTRACT(YEAR FROM OLD.transaction_date)::INTEGER
    );
    RETURN OLD;
  ELSE
    PERFORM public.update_financial_summary(
      EXTRACT(MONTH FROM NEW.transaction_date)::INTEGER,
      EXTRACT(YEAR FROM NEW.transaction_date)::INTEGER
    );
    RETURN NEW;
  END IF;
END;
$$;