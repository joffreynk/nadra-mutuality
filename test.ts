    try {
      
        // Handle passport photo first to ensure data is available for validation
        const memberCode = isDependent ? await generateDependentMemberCode(parentMemberId) : await generateMainMemberCode();
        if (!passportFile) throw new Error('Passport photo is required');
        const fd = new FormData();
        fd.append('file', passportFile);
        const up = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (!up.ok) throw new Error('Upload failed');
        const upj = await up.json();

        if (isDependent){
            if (!dependentProof) throw new Error('Dependent proof is required');
            const fd = new FormData();
            fd.append('file', dependentProof);
            const dp = await fetch('/api/uploads', { method: 'POST', body: fd });
            if (!dp.ok) throw new Error('Upload failed');
            const dpj = await dp.json();
        }


        const parsed = memberSchema.safeParse({ ...form, passportPhotoUrl: upj.url,  });
        if (!parsed.success) {
          const fieldErrors = parsed.error.flatten().fieldErrors;
          const errorMessages = Object.entries(fieldErrors)
            .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
            .join('; ');
          setError(`Please check the form: ${errorMessages}`);
          return;
        }

        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data)
        });
        if (!res.ok) throw new Error('Failed');
      }
      setSuccess('Member created');
      setForm({ memberCode: '', name: '', dob: '', contact: '', address: '', idNumber: '', category: 'Basic', coveragePercent: 100 });
      setParentMemberId('');
      setPassportFile(null);
      setDependentProof(null);
      setSelectedCompanyId(null); // Clear selected company
      setCompanySearchQuery(''); // Clear company search
    } catch (err) {
      setError('Failed to create member');
    }
  }