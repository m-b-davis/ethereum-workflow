pragma solidity ^0.4.0;

contract Workflow {

    struct Stakeholder {
        bool approved;
        bool exists; // Set to true by default to say that this address is a stakeholder
    }

    struct WorkflowState {
        string name;
        uint8 approvals;
        uint8 approvalsRequired;
        mapping(address => Stakeholder) stakeholders;
    }

    struct Nickname {
      string name;
      bool exists;
    }

    uint8 public stakeholderCount;
    uint8 public stateIndex;
    uint8 public finalStateIndex;

    mapping(uint8 => WorkflowState) workflowStates;
    address admin;
    bool workflowComplete;

    mapping(address => Nickname) nicknames;

    event ApprovalMade(string stakeholderName);
    event StateChanged(uint newStateIndex, string newStateName);
    event WorkflowComplete();

    /// Create a new ballot with $(_numProposals) different proposals.
    function Workflow() {
        admin = msg.sender;
    }

    /// Modifiers validate inputs to functions such as minimal balance or user auth;
    /// similar to guard clause in other languages
    /// '_' (underscore) often included as last line in body, and indicates
    /// function being called should be placed there
    modifier onlyAdmin { if (msg.sender != admin) throw; _ ; }

    function addWorkflowState(string name, uint8 approvalsRequired) onlyAdmin() {
        workflowStates[finalStateIndex] = WorkflowState(name, 0, approvalsRequired);
        finalStateIndex += 1;
    }

    /// Add a stakeholder for this workflow step
    /// Only the admin can add stakeholders
    function addStakeholder(address stakeholderAddress, uint8 workflowState) onlyAdmin() {
        if(msg.sender != admin) throw;
        stakeholderCount += 1;
        workflowStates[workflowState].stakeholders[stakeholderAddress] = Stakeholder({approved: false, exists: true});
    }

    /// Add a stakeholder for this workflow step
    /// Only the admin can add stakeholders
    function addStakeholders(address[] stakeholderAddresses, uint8 workflowState) onlyAdmin() {
        if(msg.sender != admin) throw;

        for (uint counter = 0; counter < stakeholderAddresses.length; counter += 1) {
          var stakeholderAddress = stakeholderAddresses[counter];
          addStakeholder(stakeholderAddress, workflowState);
        }
    }

    function setNickname(string name) {
      nicknames[msg.sender] = Nickname({name: name, exists: true});
    }

    /// Give a single vote to proposal $(proposal).
    function approve() {
        var currentWorkflowState = workflowStates[stateIndex];
        Stakeholder stakeholder = currentWorkflowState.stakeholders[msg.sender];
        if (!stakeholder.exists) throw;
        if (stakeholder.approved) return;

        stakeholder.approved = true;
        currentWorkflowState.approvals += 1;

        ApprovalMade(getNickname(msg.sender)); // fire event

        if (currentWorkflowState.approvals >= currentWorkflowState.approvalsRequired) {
            if (stateIndex == finalStateIndex) {
                workflowComplete = true;
                WorkflowComplete();
            } else {
                stateIndex += 1;
                StateChanged(stateIndex, workflowStates[stateIndex].name);
            }
        }
    }

    function getNickname(address senderAddress) private returns (string name) {
      var nickname = nicknames[senderAddress];
      if(nickname.exists) {
        return nickname.name;
      } else {
        return "Anonymous";
      }
    }

    function getCurrentStateApprovalCount() returns (uint8 approvalCount) {
      return workflowStates[stateIndex].approvals;
    }
}
